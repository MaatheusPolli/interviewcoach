export class InterviewView {
  constructor() {
    this.elements = {
      screen: document.getElementById('interview-screen'),
      counter: document.getElementById('question-counter'),
      timer: document.getElementById('timer'),
      questionText: document.getElementById('question-text'),
      answerInput: document.getElementById('answer-input'),
      micBtn: document.getElementById('mic-btn'),
      micStatus: document.querySelector('.mic-status'),
      interimTranscript: document.getElementById('interim-transcript'),
      submitBtn: document.getElementById('submit-answer-btn'),
      audioToggleBtn: document.getElementById('audio-toggle-btn')
    };
  }

  show(totalQuestions) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    this.elements.screen.classList.remove('hidden');
    this.updateCounter(1, totalQuestions);
  }

  toggleAudio(isEnabled) {
    if (isEnabled) {
      this.elements.audioToggleBtn.classList.remove('muted');
      this.elements.audioToggleBtn.textContent = '🔊';
    } else {
      this.elements.audioToggleBtn.classList.add('muted');
      this.elements.audioToggleBtn.textContent = '🔇';
    }
  }

  onAudioToggle(callback) {
    this.elements.audioToggleBtn.addEventListener('click', callback);
  }

  updateCounter(current, total) {
    this.elements.counter.textContent = `Pergunta ${current}/${total}`;
  }

  toggleTimer(isVisible) {
    if (isVisible) {
      this.elements.timer.classList.remove('hidden');
    } else {
      this.elements.timer.classList.add('hidden');
    }
  }

  updateTimer(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    this.elements.timer.textContent = `${mins}:${secs}`;
    
    // Visual cue for low time
    if (seconds <= 10) {
      this.elements.timer.style.color = '#ef4444';
    } else {
      this.elements.timer.style.color = 'inherit';
    }
  }

  setQuestion(text) {
    this.elements.questionText.textContent = text;
    this.elements.answerInput.value = '';
    this.elements.interimTranscript.textContent = '';
  }

  getAnswer() {
    return this.elements.answerInput.value;
  }

  setAnswer(text) {
    this.elements.answerInput.value = text;
  }

  setInterimTranscript(text) {
    this.elements.interimTranscript.textContent = text;
  }

  toggleMic(isActive) {
    if (isActive) {
      this.elements.micBtn.classList.add('active');
      this.elements.micStatus.textContent = 'Ouvindo...';
    } else {
      this.elements.micBtn.classList.remove('active');
      this.elements.micStatus.textContent = 'Clique para falar';
    }
  }

  showLoading(isLoading) {
    this.elements.submitBtn.disabled = isLoading;
    this.elements.submitBtn.textContent = isLoading ? 'ANALISANDO...' : 'ENVIAR RESPOSTA';
  }

  onMicClick(callback) {
    this.elements.micBtn.addEventListener('click', callback);
  }

  onSubmit(callback) {
    this.elements.submitBtn.addEventListener('click', callback);
  }
}
