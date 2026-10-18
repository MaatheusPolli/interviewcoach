import { escapeHtml } from '../utils/html.js';

export class HistoryView {
  constructor() {
    this.elements = {
      screen: document.getElementById('history-screen'),
      list: document.getElementById('history-list'),
      backBtn: document.getElementById('back-home-btn')
    };
  }

  show(sessions, progress = null) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    this.elements.screen.classList.remove('hidden');

    const summary = progress && progress.sessionCount > 0 ? this.renderProgress(progress) : '';

    if (!sessions || sessions.length === 0) {
      this.elements.list.innerHTML = '<p>Nenhuma sessão encontrada. Comece a praticar!</p>';
    } else {
      this.elements.list.innerHTML = summary + sessions.map(s => `
        <div class="card history-item">
          <div class="history-item-header">
            <strong>${escapeHtml(String(s.track).toUpperCase())} - ${escapeHtml(s.level)}</strong>
            <span>${new Date(s.timestamp).toLocaleDateString()}</span>
          </div>
          <div class="history-item-score">
            Pontuação Geral: <span class="score-badge">${Math.round(s.overallScore)}/100</span>
          </div>
        </div>
      `).join('');
    }
  }

  renderProgress(progress) {
    const badges = progress.badges.length > 0
      ? progress.badges.map(b => `<span class="badge">${escapeHtml(b.label)}</span>`).join('')
      : '<p>Continue praticando para desbloquear badges!</p>';
    return `
      <div class="card history-item progress-summary">
        <div class="history-item-header">
          <strong>Ready Score</strong>
          <span class="score-badge">${escapeHtml(progress.readyScore)}/100</span>
        </div>
        <p>Média das últimas entrevistas. Sessões concluídas: ${escapeHtml(progress.sessionCount)}</p>
        <div class="weak-topics-badges">${badges}</div>
      </div>
    `;
  }

  onBack(callback) {
    this.elements.backBtn.addEventListener('click', callback);
  }
}
