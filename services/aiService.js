export class AIService {
    constructor() {
        this.session = null;
        this.abortController = null;
    }

    async checkRequirements() {
        const errors = [];
        const isChrome = !!window.chrome;
        if (!isChrome) {
            errors.push("⚠️ Este aplicativo requer o Google Chrome ou Chrome Canary (versão recente).");
        }

        if (!('ai' in self) || !('languageModel' in self.ai)) {
            errors.push("⚠️ As APIs de IA nativas não estão ativas.");
            errors.push("Ative as seguintes flags em chrome://flags/:");
            errors.push("- Prompt API for Gemini Nano (chrome://flags/#prompt-api-for-gemini-nano)");
            return errors;
        }

        const availability = await self.ai.languageModel.availability();
        if (availability === 'no') {
            errors.push(`⚠️ Seu dispositivo não suporta modelos de linguagem de IA nativos.`);
        }

        return { errors: errors.length > 0 ? errors : null, availability };
    }

    async downloadModel(onProgress) {
        try {
            this.session = await self.ai.languageModel.create({
                monitor(m) {
                    m.addEventListener('downloadprogress', e => {
                        const percent = Math.round((e.loaded / e.total) * 100);
                        onProgress(percent);
                    });
                }
            });
            return true;
        } catch (e) {
            return false;
        }
    }

    async extractSkillsFromJD(jdText, locale = 'pt-BR') {
        try {
            if (!this.session) this.session = await self.ai.languageModel.create();
            const instruction = locale.startsWith('en') 
                ? "Extract the top 5 technical skills from this JD. Return ONLY a JSON array of strings."
                : locale.startsWith('es')
                ? "Extrae as 5 principais habilidades técnicas desta vaga. Devuelve SOLO um array JSON de strings."
                : "Extraia as 5 principais habilidades técnicas desta vaga. Retorne APENAS um array JSON de strings.";

            const prompt = `${instruction}\nJD: ${jdText}`;
            const response = await this.session.prompt(prompt);
            const cleaned = response.substring(response.indexOf('['), response.lastIndexOf(']') + 1);
            return JSON.parse(cleaned);
        } catch (e) {
            return [];
        }
    }

    async evaluateAnswer(questionText, expectedKeyPoints, candidateAnswer, locale = 'pt-BR') {
        try {
            if (!this.session) this.session = await self.ai.languageModel.create();
            
            const langName = locale.startsWith('en') ? "English" : locale.startsWith('es') ? "Spanish" : "Portuguese";

            const prompt = `
You are a Senior Technical Interviewer.
Evaluate the candidate's answer based on the question and key points.
The evaluation MUST be written in ${langName}.
Return ONLY a JSON object with this structure:
{
  "totalScore": 0-10,
  "feedback": "...",
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "dimensionAverages": { "technical": 0-10, "communication": 0-10, "precision": 0-10 }
}

Question: ${questionText}
Expected Points: ${expectedKeyPoints.join(', ')}
Candidate Answer: ${candidateAnswer}
`;
            const response = await this.session.prompt(prompt);
            return this.parseAIResponse(response);
        } catch (e) {
            console.error('AI Error:', e);
            throw e;
        }
    }

    async askFollowUp(candidateAnswer, score, topic, locale = 'pt-BR') {
        try {
            if (!this.session) this.session = await self.ai.languageModel.create();
            const langName = locale.startsWith('en') ? "English" : locale.startsWith('es') ? "Spanish" : "Portuguese";

            const prompt = `
Based on the candidate's answer about "${topic}", ask ONE challenging follow-up question to test deeper knowledge.
The question must be in ${langName}.
Candidate Answer: ${candidateAnswer}
Current Score: ${score}/10
`;
            return await this.session.prompt(prompt);
        } catch (e) {
            return null;
        }
    }

    parseAIResponse(response) {
        try {
            const start = response.indexOf('{');
            const end = response.lastIndexOf('}') + 1;
            if (start === -1 || end === 0) return null;
            return JSON.parse(response.substring(start, end).trim());
        } catch (error) {
            return null;
        }
    }
}
