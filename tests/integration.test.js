import { runner } from './test-runner.js';
import { ScoringService } from '../services/scoringService.js';
import { AIService } from '../services/aiService.js';
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

// --- CONFIGURAÇÃO DE AMBIENTE GLOBAL (MOCKS) ---
global.window = { 
  speechSynthesis: { speak: () => {}, cancel: () => {} },
  location: { reload: () => {} },
  alert: () => {},
  fetch: async () => ({ json: async () => [] })
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
    const jsonSujo = "Aqui está o resultado: {\"totalScore\": 9, \"scores\": {}, \"strengths\": [], \"missing\": [], \"improvement\": \"\", \"modelAnswer\": \"\"} Espero que ajude!";
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
        return '{"totalScore": 8, "scores": {}, "strengths": [], "missing": [], "improvement": "", "modelAnswer": ""}';
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
  
  runner.test('Mute: Dispara callbacks de início e fim no Speak', (done) => {
    // Valida se o speak está chamando os hooks necessários para o mute automático
    const service = new VoiceService();
    let startCalled = false;
    
    // Mock speechSynthesis
    const originalSpeak = window.speechSynthesis.speak;
    window.speechSynthesis.speak = (utterance) => {
        utterance.onstart();
        utterance.onend();
    };

    service.speak("Hello", "en-US", 
      () => { startCalled = true; },
      () => { 
        runner.expect(startCalled).toBe(true);
        window.speechSynthesis.speak = originalSpeak;
        done();
      }
    );
  });

  runner.test('Localização: Alterna idioma de STT corretamente', () => {
    // Valida o toggle entre PT-BR (padrão) e EN-US
    const service = new VoiceService();
    runner.expect(service.sttLanguage).toBe('pt-BR');
    
    service.toggleLanguage();
    runner.expect(service.sttLanguage).toBe('en-US');
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
    window.alert = () => { alertCalled = true; };
    
    await controller.init({ track: 'unknown', level: 'senior', mode: 'quick' });
    runner.expect(alertCalled).toBe(true);
  });
});

// Execução Final
runner.run();
