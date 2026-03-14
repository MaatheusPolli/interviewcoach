export class HistoryView {
  constructor() {
    this.elements = {
      screen: document.getElementById('history-screen'),
      list: document.getElementById('history-list'),
      backBtn: document.getElementById('back-home-btn')
    };
  }

  show(sessions) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    this.elements.screen.classList.remove('hidden');

    if (!sessions || sessions.length === 0) {
      this.elements.list.innerHTML = '<p>Nenhuma sessão encontrada. Comece a praticar!</p>';
    } else {
      this.elements.list.innerHTML = sessions.map(s => `
        <div class="card history-item">
          <div class="history-item-header">
            <strong>${s.track.toUpperCase()} - ${s.level}</strong>
            <span>${new Date(s.timestamp).toLocaleDateString()}</span>
          </div>
          <div class="history-item-score">
            Pontuação Geral: <span class="score-badge">${Math.round(s.overallScore)}/100</span>
          </div>
        </div>
      `).join('');
    }
  }

  onBack(callback) {
    this.elements.backBtn.addEventListener('click', callback);
  }
}
