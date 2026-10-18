import { validateFeedback } from './feedbackSchema.js';

// Availability values reported by the Prompt API over time.
// Old names ('readily', 'no', 'after-download') are kept for older Chrome builds.
const READY_STATES = ['available', 'readily'];
const DOWNLOAD_STATES = ['downloadable', 'downloading', 'after-download'];

export class AIService {
    constructor() {
        this.session = null;
    }

    /**
     * Locates the Prompt API (LanguageModel) without mutating globals.
     * Returns the model factory or null.
     */
    _detectAI() {
        const candidates = [
            () => globalThis.LanguageModel,
            () => globalThis.ai?.languageModel,
            () => globalThis.chrome?.ai?.languageModel
        ];

        for (const get of candidates) {
            try {
                const obj = get();
                if (obj && typeof obj.create === 'function') return obj;
            } catch (e) {
                // Namespace inexistente: tenta o próximo
            }
        }
        return null;
    }

    /**
     * Maps the current availability to one of:
     * 'ready' | 'after-download' | 'no'
     */
    _normalizeAvailability(state) {
        if (READY_STATES.includes(state)) return 'ready';
        if (DOWNLOAD_STATES.includes(state)) return 'after-download';
        return 'no';
    }

    async checkRequirements() {
        const modelAPI = this._detectAI();
        const unavailable = {
            errors: ['O Gemini Nano não está disponível neste navegador. Use o Chrome estável com a Prompt API ativada.'],
            availability: 'no'
        };

        if (!modelAPI) {
            console.warn("[AIService] Prompt API não encontrada.");
            return unavailable;
        }

        try {
            const state = await modelAPI.availability({ expectedOutputLanguage: 'en' });
            const availability = this._normalizeAvailability(state);
            if (availability === 'no') return unavailable;
            return { errors: null, availability };
        } catch (e) {
            console.error("[AIService] Erro ao verificar disponibilidade:", e);
            // Otimista: a API existe, então tentamos usá-la mesmo assim
            return { errors: null, availability: 'ready' };
        }
    }

    /**
     * Downloads the on-device model, reporting progress from 0 to 100.
     * @returns {Promise<boolean>} true when the model is ready.
     */
    async downloadModel(onProgress = () => {}) {
        const modelAPI = this._detectAI();
        if (!modelAPI) return false;

        try {
            this.session = await modelAPI.create({
                expectedOutputLanguage: 'en',
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        onProgress(Math.round((e.loaded ?? 0) * 100));
                    });
                }
            });
            return true;
        } catch (e) {
            console.error("[AIService] Erro ao baixar o modelo:", e);
            return false;
        }
    }

    async getModel() {
        if (this.session) return this.session;

        const modelAPI = this._detectAI();
        if (!modelAPI) throw new Error("Gemini Nano API not found");

        try {
            // Parâmetros de Ativação: { expectedOutputLanguage: 'en' } para "despertar" a API
            this.session = await modelAPI.create({ expectedOutputLanguage: 'en' });
            return this.session;
        } catch (e) {
            console.error("[AIService] Erro ao criar sessão do modelo:", e);
            throw e;
        }
    }

    async evaluateAnswer(questionText, expectedKeyPoints, candidateAnswer, locale = 'pt-BR', retries = 1) {
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
            const parsed = this._safeParseJSON(response, null);
            const { valid, errors } = validateFeedback(parsed);

            if (!valid && retries > 0) {
                console.log(`[AIService] Feedback inválido (${errors.join('; ')}). Tentando novamente... (${retries} restante)`);
                return await this.evaluateAnswer(questionText, expectedKeyPoints, candidateAnswer, locale, retries - 1);
            }

            return valid ? parsed : {
                totalScore: 5,
                scores: { accuracy: 5, depth: 5, clarity: 5, examples: 5, bestPractices: 5 },
                strengths: ["Avaliação automática falhou"],
                missing: ["Não foi possível extrair pontos específicos"],
                improvement: "Tente reenviar sua resposta ou simplificar o texto.",
                modelAnswer: "O sistema de IA encontrou um erro ao processar esta resposta específica."
            };
        } catch (e) {
            if (retries > 0) {
                return await this.evaluateAnswer(questionText, expectedKeyPoints, candidateAnswer, locale, retries - 1);
            }
            console.error('AI Error:', e);
            throw e;
        }
    }

    _safeParseJSON(text, fallback) {
        try {
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}') + 1;
            if (start === -1 || end <= start) return fallback;
            const jsonStr = text.substring(start, end).trim();
            return JSON.parse(jsonStr);
        } catch (e) {
            console.error("[AIService] Erro de Parsing JSON:", e, "Texto original:", text);
            return fallback;
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

    /**
     * Dica curta para quem travou: aponta um caminho sem revelar a resposta.
     * Retorna null se o modelo falhar, para a dica simplesmente não aparecer.
     */
    async getHint(questionText, expectedKeyPoints = [], locale = 'pt-BR') {
        try {
            const session = await this.getModel();
            const langName = locale.startsWith('en') ? "English" : locale.startsWith('es') ? "Spanish" : "Portuguese";
            const prompt = `You are helping a candidate in a technical interview who is stuck.
Give ONE short hint (at most two sentences) in ${langName} that points to the concept to start from.
Do NOT give the full answer. Output ONLY the hint text.

Question: ${questionText}
Topics the answer should cover: ${expectedKeyPoints.join(', ')}`;
            const hint = (await session.prompt(prompt)).trim();
            return hint || null;
        } catch (e) {
            console.error("[AIService] Erro ao gerar dica:", e);
            return null;
        }
    }

    async translateText(text, targetLocale) {
        if (targetLocale.startsWith('en')) return text; // Já está em inglês

        try {
            const session = await this.getModel();
            const langName = targetLocale.startsWith('pt') ? "Portuguese (Brazil)" : targetLocale.startsWith('es') ? "Spanish" : "Portuguese";
            const prompt = `Translate this technical interview question to ${langName}. Maintain the technical terms if they are commonly used in the industry. Output ONLY the translated text: ${text}`;
            return await session.prompt(prompt);
        } catch (e) {
            console.error("Translation error:", e);
            return text; // Fallback para o original
        }
    }
}
