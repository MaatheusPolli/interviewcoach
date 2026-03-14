// Mock Services for Testing

export class MockAIService {
  constructor() {
    this.shouldFail = false;
  }
  
  async checkRequirements() { return null; }
  
  async evaluateAnswer(q, k, a) {
    if (this.shouldFail) throw new Error('AI Error');
    return {
      scores: { accuracy: 8, depth: 7, clarity: 9, examples: 6, bestPractices: 8 },
      totalScore: 85,
      strengths: ['Good point'],
      missing: ['Missed detail'],
      improvement: 'Study more',
      modelAnswer: 'This is the model answer'
    };
  }
}

export class MockStorageService {
  constructor() {
    this.sessions = [];
    this.weakTopics = [];
  }
  async saveSession(s) { this.sessions.push(s); }
  async getAllSessions() { return this.sessions; }
  async updateWeakTopics(t) { this.weakTopics = t; }
  async getWeakTopics() { return this.weakTopics; }
}

export class MockVoiceService {
  speak(text) {}
  startListening(onInterim, onFinal) {}
  stopListening() {}
}

export class MockInterviewView {
  constructor() {
    this.shown = false;
    this.currentQuestion = '';
    this.timerVisible = false;
    this.loading = false;
    this.callbacks = {};
  }
  show(n) { this.shown = true; }
  updateCounter(c, t) {}
  setQuestion(q) { this.currentQuestion = q; }
  getAnswer() { return 'Test Answer'; }
  setAnswer(a) {}
  setInterimTranscript(t) {}
  toggleMic(s) {}
  showLoading(l) { this.loading = l; }
  toggleTimer(v) { this.timerVisible = v; }
  updateTimer(t) {}
  
  onMicClick(cb) { this.callbacks.mic = cb; }
  onSubmit(cb) { this.callbacks.submit = cb; }
}

export class MockFeedbackView {
  show(f, l) {}
  onNext(cb) { this.callbacks = { next: cb }; }
}

export class MockDashboardView {
  show(s) {}
  onRestart(cb) {}
  onHome(cb) {}
}
