export class AIService {
    constructor() {
        this.session = null;
    }

    async checkRequirements() {
        // Tenta encontrar a IA em qualquer lugar (window, self, navigator)
        let ai = null;
        try { ai = window.ai; } catch(e) {}
        if (!ai) { try { ai = self.ai; } catch(e) {} }
        if (!ai) { try { ai = navigator.ai; } catch(e) {} }

        const modelAPI = ai ? (ai.languageModel || ai.assistant) : null;

        if (!modelAPI) {
            console.warn("⚠️ IA Nativa (Gemini Nano) não detectada. O aplicativo seguirá, mas as avaliações de respostas falharão.");
            // Retorna null para errors para NÃO BLOQUEAR a tela inicial
            return { errors: null, availability: 'no' };
        }

        try {
            const availability = await modelAPI.availability();
            return { errors: null, availability };
        } catch (e) {
            return { errors: null, availability: 'readily' };
        }
    }

    async getModel() {
        if (this.session) return this.session;
        
        let ai = null;
        try { ai = window.ai; } catch(e) {}
        if (!ai) { try { ai = self.ai; } catch(e) {} }
        if (!ai) { try { ai = navigator.ai; } catch(e) {} }
        
        if (!ai) throw new Error("AI API not found on window, self or navigator");
        
        const modelAPI = ai.languageModel || ai.assistant;
        if (!modelAPI) throw new Error("languageModel or assistant API not found");
        
        this.session = await modelAPI.create();
        return this.session;
    }

    async evaluateAnswer(questionText, expectedKeyPoints, candidateAnswer, locale = 'pt-BR') {
        try {
            const session = await this.getModel();
            const langName = locale.startsWith('en') ? "English" : locale.startsWith('es') ? "Spanish" : "Portuguese";

            const prompt = `
You are a Senior Technical Interviewer.
Evaluate the candidate's answer based on the question and key points.
The evaluation MUST be written in ${langName}.
Return ONLY a JSON object:
{
  "totalScore": 8,
  "scores": { "accuracy": 8, "depth": 7, "clarity": 9, "examples": 6, "bestPractices": 7 },
  "strengths": ["...", "..."],
  "missing": ["...", "..."],
  "improvement": "...",
  "modelAnswer": "..."
}

Question: ${questionText}
Expected Points: ${expectedKeyPoints.join(', ')}
Candidate Answer: ${candidateAnswer}
`;
            const response = await session.prompt(prompt);
            const start = response.indexOf('{');
            const end = response.lastIndexOf('}') + 1;
            if (start === -1) throw new Error("Invalid AI response: No JSON found");
            return JSON.parse(response.substring(start, end).trim());
        } catch (e) {
            console.error('AI Error:', e);
            throw e;
        }
    }

    async extractSkillsFromJD(jdText, locale = 'pt-BR') {
        try {
            const session = await this.getModel();
            const prompt = `Extract top 5 technical skills from this JD as a JSON array of strings: ${jdText}`;
            const response = await session.prompt(prompt);
            const start = response.indexOf('[');
            const end = response.lastIndexOf(']') + 1;
            if (start === -1) return [];
            return JSON.parse(response.substring(start, end));
        } catch (e) {
            console.error("Skills extraction error:", e);
            return [];
        }
    }

    async askFollowUp(candidateAnswer, score, topic, locale = 'pt-BR') {
        try {
            const session = await this.getModel();
            const langName = locale.startsWith('en') ? "English" : locale.startsWith('es') ? "Spanish" : "Portuguese";
            const prompt = `Based on this answer about ${topic} (Score: ${score}/10), ask ONE short, challenging follow-up question in ${langName}: ${candidateAnswer}`;
            return await session.prompt(prompt);
        } catch (e) {
            return null;
        }
    }
}
