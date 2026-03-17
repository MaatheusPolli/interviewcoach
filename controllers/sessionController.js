export class SessionController {
  constructor(services, views) {
    this.services = services;
    this.views = views;
    
    this.session = {
      questions: [],
      currentIndex: 0,
      results: [],
      config: null
    };

    this.isListening = false;
    this.isFollowUp = false;
    this.isAudioEnabled = true;
  }

  async init(config) {
    this.session.config = config;
    this.session.currentIndex = 0;
    this.session.results = [];
    
    // Set Voice Service Language
    this.services.voice.setLanguage(config.language || 'pt-BR');

    try {
      const response = await fetch(`data/questions-${config.track}.json`);
      const allQuestions = await response.json();
      
      let filtered = allQuestions.filter(q => q.level === config.level);
      
      if (config.jd) {
        const skills = await this.services.ai.extractSkillsFromJD(config.jd, config.language);
        if (skills && skills.length > 0) {
          const jdQuestions = filtered.filter(q => 
            skills.some(skill => 
              q.topic.toLowerCase().includes(skill.toLowerCase()) || 
              q.question.toLowerCase().includes(skill.toLowerCase())
            )
          );
          if (jdQuestions.length > 0) filtered = jdQuestions;
        }
      }

      if (config.mode === 'weakness') {
        const weakTopics = await this.services.storage.getWeakTopics();
        if (weakTopics && weakTopics.length > 0) {
          const weakTopicNames = weakTopics.map(t => t.topic);
          const weaknessQuestions = filtered.filter(q => weakTopicNames.includes(q.topic));
          if (weaknessQuestions.length >= 5) {
            filtered = weaknessQuestions;
          } else {
            const others = filtered.filter(q => !weakTopicNames.includes(q.topic));
            filtered = [...weaknessQuestions, ...others];
          }
        }
      }

      const count = config.mode === 'full' ? 10 : 5;
      this.session.questions = this.shuffle(filtered).slice(0, count);

      if (this.session.questions.length === 0) {
        alert('Nenhuma pergunta encontrada para os critérios selecionados.');
        return;
      }

      this.startInterview();
    } catch (error) {
      console.error('Falha ao carregar perguntas:', error);
      alert('Erro ao carregar as perguntas da entrevista.');
    }
  }

  startInterview() {
    this.views.interview.show(this.session.questions.length);
    this.views.interview.toggleAudio(this.isAudioEnabled);
    this.nextQuestion();
    if (!this.listenersSet) {
      this.setupListeners();
      this.listenersSet = true;
    }
  }

  setupListeners() {
    this.views.interview.onMicClick(() => this.handleMicToggle());
    this.views.interview.onSubmit(() => this.handleSubmitAnswer());
    this.views.interview.onAudioToggle(() => this.handleAudioToggle());
    this.views.feedback.onNext(() => this.handleNextStep());
    this.views.dashboard.onRestart(() => this.init(this.session.config));
    this.views.dashboard.onExport(() => this.handleExport());
    this.views.dashboard.onHome(() => window.location.reload());
  }

  handleAudioToggle() {
    this.isAudioEnabled = !this.isAudioEnabled;
    this.views.interview.toggleAudio(this.isAudioEnabled);
    if (!this.isAudioEnabled) {
      this.services.voice.cancel();
    }
  }

  handleExport() {
    if (!this.lastSessionData) return;
    const filename = `interview-result-${this.lastSessionData.track}-${new Date().toISOString().split('T')[0]}.json`;
    this.services.storage.exportData(this.lastSessionData, filename);
  }

  nextQuestion() {
    const question = this.session.questions[this.session.currentIndex];
    this.views.interview.updateCounter(this.session.currentIndex + 1, this.session.questions.length);
    this.views.interview.setQuestion(question.question);
    
    if (this.isAudioEnabled) {
      this.services.voice.speak(
        question.question, 
        this.session.config.language,
        () => {
          if (this.isListening) {
            this.services.voice.stopListening();
            this.views.interview.toggleMic(false);
            this.wasListeningBeforeSpeak = true;
          }
        },
        () => {
          if (this.wasListeningBeforeSpeak) {
            this.handleMicToggle();
            this.wasListeningBeforeSpeak = false;
          }
        }
      );
    }

    this.stopTimer();
    if (this.session.config.mode === 'full') {
      this.startTimer(120);
    } else {
      this.views.interview.toggleTimer(false);
    }
  }

  startTimer(seconds) {
    let remaining = seconds;
    this.views.interview.toggleTimer(true);
    this.views.interview.updateTimer(remaining);
    this.timerInterval = setInterval(() => {
      remaining--;
      this.views.interview.updateTimer(remaining);
      if (remaining <= 0) {
        this.stopTimer();
        this.handleSubmitAnswer(true);
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  handleMicToggle() {
    if (this.isListening) {
      this.services.voice.stopListening();
      this.isListening = false;
      this.views.interview.toggleMic(false);
    } else {
      this.views.interview.toggleMic(true);
      this.isListening = true;
      this.services.voice.startListening(
        (interim) => this.views.interview.setInterimTranscript(interim),
        (final) => {
          const currentText = this.views.interview.getAnswer();
          this.views.interview.setAnswer(currentText + ' ' + final);
          this.handleMicToggle();
        }
      );
    }
  }

  async handleSubmitAnswer(isAutoSubmit = false) {
    this.stopTimer();
    const answer = this.views.interview.getAnswer();
    if (!answer.trim() && !isAutoSubmit) return; 

    this.views.interview.showLoading(true);
    const question = this.session.questions[this.session.currentIndex];

    try {
      const evaluation = await this.services.ai.evaluateAnswer(
        question.question,
        question.expectedKeyPoints,
        answer || "(No answer provided)",
        this.session.config.language
      );

      this.session.results.push({
        questionId: question.id,
        topic: question.topic,
        answer,
        ...evaluation
      });

      this.views.interview.showLoading(false);
      const isLast = this.session.currentIndex === this.session.questions.length - 1;

      if (this.session.config.mode === 'deepdive' && !this.isFollowUp) {
        this.isFollowUp = true;
        const followUpQuestion = await this.services.ai.askFollowUp(
          answer,
          evaluation.totalScore,
          question.topic,
          this.session.config.language
        );
        
        if (followUpQuestion) {
          const followUpObj = {
            id: `${question.id}-fu`,
            topic: question.topic,
            question: followUpQuestion,
            expectedKeyPoints: ["Detailed explanation of the point discussed"]
          };
          this.session.questions.splice(this.session.currentIndex + 1, 0, followUpObj);
          this.views.feedback.show(evaluation, false, true);
          return;
        }
      }

      this.isFollowUp = false;
      this.views.feedback.show(evaluation, isLast);
      
    } catch (error) {
      this.views.interview.showLoading(false);
      console.error('Evaluation error:', error);
      alert('Error processing your answer. Please try again.');
    }
  }

  handleNextStep() {
    if (this.session.currentIndex < this.session.questions.length - 1) {
      this.session.currentIndex++;
      this.views.interview.show(this.session.questions.length);
      this.nextQuestion();
    } else {
      this.finishInterview();
    }
  }

  async finishInterview() {
    const sessionScore = this.services.scoring.calculateSessionScore(this.session.results);
    const sessionData = {
      timestamp: Date.now(),
      track: this.session.config.track,
      level: this.session.config.level,
      mode: this.session.config.mode,
      language: this.session.config.language,
      overallScore: sessionScore.overall,
      scoreByTopic: sessionScore.byTopic,
      dimensionAverages: sessionScore.dimensionAverages,
      questionResults: this.session.results
    };

    this.lastSessionData = sessionData;
    await this.services.storage.saveSession(sessionData);
    
    const weakTopics = Object.entries(sessionScore.byTopic).map(([topic, score]) => ({
      topic,
      averageScore: score,
      lastUpdated: Date.now()
    }));
    await this.services.storage.updateWeakTopics(weakTopics);

    this.views.dashboard.show(sessionScore);
  }

  shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }
}
