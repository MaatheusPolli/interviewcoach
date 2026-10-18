import { readFileSync } from 'node:fs';
import { runner } from './test-runner.js';
import { ScoringService } from '../services/scoringService.js';
import { AIService } from '../services/aiService.js';
import { validateFeedback } from '../services/feedbackSchema.js';
import { escapeHtml } from '../utils/html.js';
import { summarizeProgress } from '../services/gamificationService.js';
import { VoiceService } from '../services/voiceService.js';
import { SessionController } from '../controllers/sessionController.js';
import { 
  MockAIService, 
  MockStorageService, 
  MockVoiceService, 
  MockInterviewView, 
  MockFeedbackView, 
  MockDashboardView 
} from './mocks.js';

// JSON de feedback completo e válido; `nota` controla totalScore
const JSON_VALIDO = (nota) => JSON.stringify({
  totalScore: nota,
  scores: { accuracy: nota, depth: nota, clarity: nota, examples: nota, bestPractices: nota },
  strengths: ['ponto forte'],
  missing: ['ponto faltando'],
  improvement: 'melhorar',
  modelAnswer: 'resposta modelo'
});

// --- CONFIGURAÇÃO DE AMBIENTE GLOBAL (MOCKS) ---
global.window = { 
  speechSynthesis: { speak: () => {}, cancel: () => {}, getVoices: () => [] },
  location: { reload: () => {} },
  alert: () => {},
  fetch: async () => ({ json: async () => [] })
};
global.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; }
};
global.document = {
  querySelectorAll: () => [],
  getElementById: () => ({ 
    classList: { add: () => {}, remove: () => {} },
    innerHTML: ''
  }),
  createElement: () => ({ textContent: '', className: '' })
};

const scoring = new ScoringService();
const ai = new AIService();
const voice = new VoiceService();

runner.group('Módulo: ScoringService (Cálculos de Pontuação)', () => {

  runner.test('Caminho Feliz: Calcula média correta das dimensões e total', () => {
    // Valida se o serviço soma e divide corretamente as 5 dimensões da IA (Escala 0-10)
    const resultados = [
      { totalScore: 8, scores: { accuracy: 8, depth: 7, clarity: 9, examples: 8, bestPractices: 8 }, topic: 'JS' },
      { totalScore: 6, scores: { accuracy: 6, depth: 5, clarity: 7, examples: 6, bestPractices: 6 }, topic: 'JS' }
    ];
    const final = scoring.calculateSessionScore(resultados);
    
    runner.expect(final.overall).toBe(7);
    runner.expect(final.dimensionAverages.accuracy).toBe(7);
    runner.expect(final.dimensionAverages.depth).toBe(6);
  });

  runner.test('Limite: Lida com lista de resultados vazia', () => {
    // Garante que o sistema não quebra se o usuário não responder nada
    const final = scoring.calculateSessionScore([]);
    runner.expect(final).toBe(null);
  });

  runner.test('Edge Case: Lida com dimensões ausentes (scores nulos)', () => {
    // Valida resiliência caso a IA retorne um objeto incompleto
    const resultados = [{ totalScore: 50, scores: null, topic: 'CSS' }];
    const final = scoring.calculateSessionScore(resultados);
    runner.expect(final.dimensionAverages.accuracy).toBe(0);
    runner.expect(final.overall).toBe(50);
  });
});

runner.group('Módulo: AIService (Resiliência e Parser)', () => {

  runner.test('Resiliência: Aciona Fallback após falha persistente de JSON', async () => {
    const mockSession = {
      prompt: async () => "Texto inválido que não é JSON"
    };
    const aiService = new AIService();
    aiService.session = mockSession;
    
    // Com retries = 0 para teste rápido
    const res = await aiService.evaluateAnswer("Q", ["P"], "A", "pt-BR", 0);
    
    // Deve retornar o objeto de fallback definido
    runner.expect(res.totalScore).toBe(5);
    runner.expect(res.strengths[0]).toBe("Avaliação automática falhou");
  });

  runner.test('Parser: Limpa texto extra ao redor do JSON', async () => {
    const jsonSujo = "Aqui está o resultado: " + JSON_VALIDO(9) + " Espero que ajude!";
    const mockSession = { prompt: async () => jsonSujo };
    
    const aiService = new AIService();
    aiService.session = mockSession;
    const res = await aiService.evaluateAnswer("Q", [], "A");
    
    runner.expect(res.totalScore).toBe(9);
  });

  runner.test('Parser: Dispara Retry em caso de JSON inválido', async () => {
    let callCount = 0;
    const mockSession = {
      prompt: async () => {
        callCount++;
        if (callCount === 1) return '{"totalScore": 9, "scores": {'; // JSON inválido
        return JSON_VALIDO(8);
      }
    };
    
    const aiService = new AIService();
    aiService.session = mockSession;
    const res = await aiService.evaluateAnswer("Q", [], "A", "pt-BR", 1);
    
    runner.expect(callCount).toBe(2);
    runner.expect(res.totalScore).toBe(8);
  });
});

runner.group('Módulo: VoiceService (Localização e Sync)', () => {
  
  runner.test('Mute: Dispara callbacks de início e fim no Speak', async () => {
    // Valida se o speak está chamando os hooks necessários para o mute automático
    const service = new VoiceService();
    const originalSpeak = window.speechSynthesis.speak;

    // Mock speechSynthesis: dispara start e end imediatamente
    window.speechSynthesis.speak = (utterance) => {
        utterance.onstart();
        utterance.onend();
    };

    try {
      const events = await new Promise((resolve) => {
        const seen = [];
        service.speak("Hello", "en-US",
          () => seen.push('start'),
          () => { seen.push('end'); resolve(seen); }
        );
      });
      runner.expect(events).toEqual(['start', 'end']);
    } finally {
      window.speechSynthesis.speak = originalSpeak;
    }
  });

  runner.test('Localização: Troca idioma de STT corretamente', () => {
    // Valida o padrão PT-BR e a troca para EN-US via setLanguage
    const service = new VoiceService();
    runner.expect(service.locale).toBe('pt-BR');

    service.setLanguage('en-US');
    runner.expect(service.locale).toBe('en-US');
  });
});

runner.group('Integração: SessionController (Fluxo Completo)', () => {

  const setup = () => {
    const services = {
      ai: new MockAIService(),
      voice: new MockVoiceService(),
      storage: new MockStorageService(),
      scoring: new ScoringService()
    };
    const views = {
      interview: new MockInterviewView(),
      feedback: new MockFeedbackView(),
      dashboard: new MockDashboardView()
    };
    return { controller: new SessionController(services, views), services, views };
  };

  runner.test('Fluxo: Finalização de sessão salva médias de dimensão', async () => {
    // Verifica se os dados do radar estão sendo persistidos corretamente no IndexedDB
    const { controller, services } = setup();
    controller.session.results = [
      { totalScore: 100, scores: { accuracy: 10, depth: 10, clarity: 10, examples: 10, bestPractices: 10 }, topic: 'Git' }
    ];
    controller.session.config = { track: 'frontend', level: 'mid', mode: 'quick' };
    
    await controller.finishInterview();
    
    const saved = services.storage.lastSavedSession;
    runner.expect(saved.dimensionAverages.accuracy).toBe(10);
    runner.expect(saved.overallScore).toBe(100);
  });

  runner.test('Erro: Alerta quando não há perguntas para o filtro', async () => {
    // Caso de borda: trilha vazia ou nível inexistente
    const { controller } = setup();
    window.fetch = async () => ({ json: async () => [] }); // Mock fetch vazio
    
    let alertCalled = false;
    global.alert = () => { alertCalled = true; };
    
    await controller.init({ track: 'unknown', level: 'senior', mode: 'quick' });
    runner.expect(alertCalled).toBe(true);
  });

  runner.test('Filtro: Sessão usa apenas perguntas do tópico escolhido', async () => {
    const { controller } = setup();
    const banco = [
      { id: 1, track: 'frontend', level: 'mid', topic: 'React', question: 'q1', expectedKeyPoints: [] },
      { id: 2, track: 'frontend', level: 'mid', topic: 'CSS', question: 'q2', expectedKeyPoints: [] },
      { id: 3, track: 'frontend', level: 'junior', topic: 'React', question: 'q3', expectedKeyPoints: [] }
    ];
    const previousFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ json: async () => banco });
    try {
      await controller.init({ track: 'frontend', level: 'mid', mode: 'quick', topic: 'React' });
    } finally {
      globalThis.fetch = previousFetch;
    }
    runner.expect(controller.session.questions.length).toBe(2);
    runner.expect(controller.session.questions.every(q => q.topic === 'React')).toBe(true);
  });
});

runner.group('Módulo: Validação do feedback (feedbackSchema)', () => {

  runner.test('Schema: Aceita feedback completo e válido', () => {
    runner.expect(validateFeedback(JSON.parse(JSON_VALIDO(7))).valid).toBe(true);
  });

  runner.test('Schema: Reporta campo faltando', () => {
    const { valid, errors } = validateFeedback({ totalScore: 5, scores: {} });
    runner.expect(valid).toBe(false);
    runner.expect(errors.some(e => e.includes('strengths'))).toBe(true);
  });

  runner.test('Schema: Rejeita nota fora de 0–10', () => {
    const fb = JSON.parse(JSON_VALIDO(7));
    fb.totalScore = 11;
    runner.expect(validateFeedback(fb).valid).toBe(false);
    fb.totalScore = 7;
    fb.scores.depth = -1;
    runner.expect(validateFeedback(fb).valid).toBe(false);
  });

  runner.test('Schema: Rejeita null e arrays no lugar do objeto', () => {
    runner.expect(validateFeedback(null).valid).toBe(false);
    runner.expect(validateFeedback([]).valid).toBe(false);
  });
});

runner.group('Módulo: Escape de HTML (utils/html)', () => {

  runner.test('Escape: Neutraliza tags e aspas', () => {
    runner.expect(escapeHtml('<img src=x onerror="alert(1)">'))
      .toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  });

  runner.test('Escape: Trata null/undefined como texto vazio', () => {
    runner.expect(escapeHtml(null)).toBe('');
    runner.expect(escapeHtml(undefined)).toBe('');
  });
});

runner.group('Módulo: Disponibilidade do modelo (Prompt API)', () => {

  const withModel = async (model, fn) => {
    const previous = globalThis.LanguageModel;
    globalThis.LanguageModel = model;
    try { await fn(); } finally { globalThis.LanguageModel = previous; }
  };

  runner.test('Disponibilidade: Estado "available" fica pronto', async () => {
    await withModel({ availability: async () => 'available', create: async () => ({}) }, async () => {
      const res = await new AIService().checkRequirements();
      runner.expect(res.availability).toBe('ready');
      runner.expect(res.errors).toBe(null);
    });
  });

  runner.test('Disponibilidade: Estado "downloadable" pede download', async () => {
    await withModel({ availability: async () => 'downloadable', create: async () => ({}) }, async () => {
      const res = await new AIService().checkRequirements();
      runner.expect(res.availability).toBe('after-download');
    });
  });

  runner.test('Disponibilidade: Estado "unavailable" gera erro', async () => {
    await withModel({ availability: async () => 'unavailable', create: async () => ({}) }, async () => {
      const res = await new AIService().checkRequirements();
      runner.expect(res.availability).toBe('no');
      runner.expect(res.errors.length > 0).toBe(true);
    });
  });

  runner.test('Disponibilidade: Não cria objeto window.ai', async () => {
    const hadAi = 'ai' in globalThis;
    await withModel({ availability: async () => 'available', create: async () => ({}) }, async () => {
      await new AIService().checkRequirements();
    });
    runner.expect('ai' in globalThis).toBe(hadAi);
  });
});

runner.group('Módulo: Service Worker', () => {

  runner.test('SW: Versão do cache acompanha package.json', () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
    runner.expect(sw.includes(`const CACHE_NAME = 'interviewcoach-v${pkg.version}';`)).toBe(true);
  });
});

runner.group('Módulo: Gamificação (Ready Score e badges)', () => {

  const sess = (track, overallScore) => ({ track, overallScore });

  runner.test('Gamificação: Sem sessões retorna zero e nenhum badge', () => {
    const p = summarizeProgress([]);
    runner.expect(p.readyScore).toBe(0);
    runner.expect(p.badges.length).toBe(0);
  });

  runner.test('Gamificação: Ready Score usa só as últimas 5 sessões', () => {
    const history = [sess('backend', 10), sess('backend', 90), sess('backend', 90), sess('backend', 90), sess('backend', 90), sess('backend', 90)];
    runner.expect(summarizeProgress(history).readyScore).toBe(90);
  });

  runner.test('Gamificação: Concede badge de especialista com 3 sessões e média 70+', () => {
    const history = [sess('backend', 70), sess('backend', 75), sess('backend', 80), sess('frontend', 50)];
    const ids = summarizeProgress(history).badges.map(b => b.id);
    runner.expect(ids.includes('specialist-backend')).toBe(true);
    runner.expect(ids.includes('specialist-frontend')).toBe(false);
  });

  runner.test('Gamificação: Badge "sharp" exige nota 80+ em uma sessão', () => {
    const ids = summarizeProgress([sess('data', 79)]).badges.map(b => b.id);
    runner.expect(ids.includes('sharp')).toBe(false);
    const ids2 = summarizeProgress([sess('data', 80)]).badges.map(b => b.id);
    runner.expect(ids2.includes('sharp')).toBe(true);
  });
});

runner.group('Módulo: Dica em tempo real (Hinter)', () => {

  const buildController = (hintText, answer = '') => {
    const services = { ai: { getHint: async () => hintText }, voice: new MockVoiceService(), storage: new MockStorageService(), scoring: new ScoringService() };
    const shown = [];
    const views = {
      interview: { getAnswer: () => answer, showHint: (t) => shown.push(t), clearHint: () => {} },
      feedback: new MockFeedbackView(),
      dashboard: new MockDashboardView()
    };
    const controller = new SessionController(services, views);
    controller.session.questions = [{ question: 'Q?', expectedKeyPoints: ['A'] }];
    controller.session.currentIndex = 0;
    controller.session.config = { mode: 'quick', language: 'pt-BR' };
    return { controller, shown };
  };

  runner.test('Hinter: Mostra a dica quando o usuário está em silêncio', async () => {
    const { controller, shown } = buildController('Pense em closures');
    await controller.showHint(controller.session.questions[0]);
    runner.expect(shown.length).toBe(1);
    runner.expect(shown[0]).toBe('Pense em closures');
  });

  runner.test('Hinter: Não mostra dica se o usuário já escreveu algo', async () => {
    const { controller, shown } = buildController('Pense em closures', 'já respondi');
    await controller.showHint(controller.session.questions[0]);
    runner.expect(shown.length).toBe(0);
  });

  runner.test('Hinter: Não mostra dica no modo cronometrado', () => {
    const { controller } = buildController('x');
    controller.session.config.mode = 'full';
    controller.startHinter(controller.session.questions[0]);
    runner.expect(controller.hintTimer).toBe(null);
  });
});

// Execução Final
runner.run();
