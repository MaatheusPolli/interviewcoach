export class AIService {
    constructor() {
        this.session = null;
    }

    /**
     * Detector Universal e Robusto para Gemini Nano (Chrome AI)
     * Verifica múltiplos namespaces e normaliza para window.ai.languageModel
     */
    _detectAI() {
        // Se já estiver normalizado, retorna
        if (window.ai?.languageModel) return window.ai.languageModel;

        const possibilities = [
            { name: 'window.ai.languageModel', get: () => window.ai?.languageModel },
            { name: 'window.ai.assistant', get: () => window.ai?.assistant },
            { name: 'window.model', get: () => window.model },
            { name: 'self.LanguageModel', get: () => self.LanguageModel },
            { name: 'navigator.ai.languageModel', get: () => navigator.ai?.languageModel },
            { name: 'window.chrome.ai.languageModel', get: () => window.chrome?.ai?.languageModel }
        ];

        for (const { name, get } of possibilities) {
            try {
                const obj = get();
                if (obj) {
                    console.log(`[AIService] API encontrada em ${name}`);
                    
                    // Fallback de Namespace: Garante que o objeto window.ai exista
                    if (typeof window.ai === 'undefined') {
                        window.ai = {};
                    }
                    
                    // Normalização: Mapeia para window.ai.languageModel
                    window.ai.languageModel = obj;
                    return obj;
                }
            } catch (e) {
                // Silenciosamente ignora erros de acesso a namespaces inexistentes
            }
        }

        return null;
    }

    async checkRequirements() {
        const modelAPI = this._detectAI();

        if (!modelAPI) {
            console.warn("⚠️ IA Nativa (Gemini Nano) não detectada em nenhum namespace conhecido. O aplicativo seguirá, mas as avaliações de respostas falharão.");
            return { errors: null, availability: 'no' };
        }

        try {
            // Parâmetros de Ativação: 'expectedOutputLanguage' essencial para certas versões
            const availability = await modelAPI.availability({ expectedOutputLanguage: 'en' });
            return { errors: null, availability };
        } catch (e) {
            console.error("[AIService] Erro ao verificar disponibilidade:", e);
            // Fallback otimista se a chamada falhar mas a API existir
            return { errors: null, availability: 'readily' };
        }
    }

    async getModel() {
        if (this.session) return this.session;
        
        const modelAPI = this._detectAI();
        if (!modelAPI) throw new Error("Gemini Nano API not found in any supported namespace");
        
        try {
            // Parâmetros de Ativação: { expectedOutputLanguage: 'en' } para "despertar" a API
            this.session = await modelAPI.create({ expectedOutputLanguage: 'en' });
            return this.session;
        } catch (e) {
            console.error("[AIService] Erro ao criar sessão do modelo:", e);
            throw e;
        }
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
