export class FeedbackView {
  constructor() {
    this.elements = {
      screen: document.getElementById('feedback-screen'),
      content: document.getElementById('feedback-content'),
      nextBtn: document.getElementById('next-question-btn')
    };
  }

  show(feedback, isLast, hasFollowUp = false) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    this.elements.screen.classList.remove('hidden');
    
    if (hasFollowUp) {
      this.elements.nextBtn.textContent = 'RESPONDER FOLLOW-UP ➡️';
    } else {
      this.elements.nextBtn.textContent = isLast ? 'FINALIZAR ENTREVISTA' : 'PRÓXIMA PERGUNTA';
    }
    this.renderFeedback(feedback);
  }

  renderFeedback(f) {
    const getScoreClass = (s) => s >= 8 ? 'score-high' : s >= 5 ? 'score-mid' : 'score-low';
    
    this.elements.content.innerHTML = `
      <div class="overall-result">
        <span class="label">Precisão Técnica:</span>
        <span class="score-badge ${getScoreClass(f.scores.accuracy)}">${f.scores.accuracy}/10</span>
      </div>

      <div class="feedback-section">
        <h3>✅ Pontos Fortes</h3>
        <ul>${f.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>

      <div class="feedback-section">
        <h3>⚠️ Pontos a Melhorar</h3>
        <ul>${f.missing.map(m => `<li>${m}</li>`).join('')}</ul>
        <p><strong>Sugestão:</strong> ${f.improvement}</p>
      </div>

      <div class="feedback-section">
        <h3>💡 Resposta Modelo</h3>
        <p class="model-answer">${f.modelAnswer}</p>
      </div>
    `;
  }

  onNext(callback) {
    this.elements.nextBtn.addEventListener('click', callback);
  }
}
