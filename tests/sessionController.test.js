import { runner } from './test-runner.js';
import { SessionController } from '../controllers/sessionController.js';
import { ScoringService } from '../services/scoringService.js';
import { 
  MockAIService, 
  MockStorageService, 
  MockVoiceService, 
  MockInterviewView, 
  MockFeedbackView, 
  MockDashboardView 
} from './mocks.js';

// Global Fetch Mock
window.fetch = async (url) => {
  if (url.includes('questions')) {
    return {
      json: async () => [
        { id: 1, topic: 'React', level: 'mid', question: 'Q1', expectedKeyPoints: [] },
        { id: 2, topic: 'CSS', level: 'mid', question: 'Q2', expectedKeyPoints: [] },
        { id: 3, topic: 'Node', level: 'mid', question: 'Q3', expectedKeyPoints: [] },
        { id: 4, topic: 'SQL', level: 'mid', question: 'Q4', expectedKeyPoints: [] },
        { id: 5, topic: 'Git', level: 'mid', question: 'Q5', expectedKeyPoints: [] },
        { id: 6, topic: 'API', level: 'mid', question: 'Q6', expectedKeyPoints: [] },
      ]
    };
  }
};

runner.group('SessionController Tests', () => {

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
    const controller = new SessionController(services, views);
    return { controller, services, views };
  };

  runner.test('Init: Loads Quick Mode (5 questions)', async () => {
    const { controller } = setup();
    await controller.init({ track: 'frontend', level: 'mid', mode: 'quick' });
    
    runner.expect(controller.session.questions.length).toBe(5);
  });

  runner.test('Init: Loads Full Mode (Timer enabled)', async () => {
    const { controller, views } = setup();
    await controller.init({ track: 'frontend', level: 'mid', mode: 'full' });
    
    runner.expect(controller.session.questions.length).toBe(6); // Mock has 6, full takes up to 10
    runner.expect(views.interview.timerVisible).toBe(true);
    controller.stopTimer(); // Clean up
  });

  runner.test('Weakness Mode: Filters by weak topics', async () => {
    const { controller, services } = setup();
    
    // Mock weak topics
    services.storage.weakTopics = [{ topic: 'React', averageScore: 5 }];
    
    await controller.init({ track: 'frontend', level: 'mid', mode: 'weakness' });
    
    // Should prioritize React question
    const hasReact = controller.session.questions.some(q => q.topic === 'React');
    runner.expect(hasReact).toBe(true);
  });

  runner.test('Submit Answer: Calls AI Service', async () => {
    const { controller, services } = setup();
    await controller.init({ track: 'frontend', level: 'mid', mode: 'quick' });
    
    await controller.handleSubmitAnswer();
    
    runner.expect(controller.session.results.length).toBe(1);
    runner.expect(controller.session.results[0].scores.accuracy).toBe(8);
  });

});
