export class DashboardView {
  constructor() {
    this.elements = {
      screen: document.getElementById('dashboard-screen'),
      finalScore: document.getElementById('final-score'),
      canvas: document.getElementById('score-chart'),
      weakSpots: document.getElementById('weak-spots-list'),
      exportBtn: document.getElementById('export-btn'),
      restartBtn: document.getElementById('restart-btn'),
      homeBtn: document.getElementById('home-btn')
    };
    this.ctx = this.elements.canvas.getContext('2d');
  }

  show(sessionScore) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    this.elements.screen.classList.remove('hidden');

    this.elements.finalScore.textContent = Math.round(sessionScore.overall);
    this.drawRadarChart(sessionScore);
    this.renderWeakSpots(sessionScore.weakestTopics);
  }

  drawRadarChart(sessionScore) {
    const ctx = this.ctx;
    const labels = ['Precisão', 'Profundidade', 'Clareza', 'Exemplos', 'Boas Práticas'];
    
    // Use averaged dimensions from all questions
    const averages = sessionScore.dimensionAverages || {
      accuracy: 0, depth: 0, clarity: 0, examples: 0, bestPractices: 0
    };

    const data = [
      averages.accuracy,
      averages.depth,
      averages.clarity,
      averages.examples,
      averages.bestPractices
    ];
    
    const centerX = this.elements.canvas.width / 2;
    const centerY = this.elements.canvas.height / 2;
    const radius = 100;
    const angleStep = (Math.PI * 2) / labels.length;

    ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);

    // Draw background circles
    ctx.strokeStyle = '#e2e8f0';
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius / 5) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw axes
    ctx.beginPath();
    for (let i = 0; i < labels.length; i++) {
      const x = centerX + Math.cos(i * angleStep - Math.PI / 2) * radius;
      const y = centerY + Math.sin(i * angleStep - Math.PI / 2) * radius;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      
      // Labels
      ctx.fillStyle = '#64748b';
      ctx.font = '12px Segoe UI';
      const labelX = centerX + Math.cos(i * angleStep - Math.PI / 2) * (radius + 20);
      const labelY = centerY + Math.sin(i * angleStep - Math.PI / 2) * (radius + 20);
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], labelX, labelY);
    }
    ctx.stroke();

    // Draw data polygon
    ctx.beginPath();
    ctx.fillStyle = 'rgba(37, 99, 235, 0.4)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;

    for (let i = 0; i < labels.length; i++) {
      const val = data[i] / 10; // Normalize 0-10 to 0-1
      const x = centerX + Math.cos(i * angleStep - Math.PI / 2) * radius * val;
      const y = centerY + Math.sin(i * angleStep - Math.PI / 2) * radius * val;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  renderWeakSpots(topics) {
    this.elements.weakSpots.innerHTML = `
      <h3>🔍 Tópicos para Focar</h3>
      <div class="weak-topics-badges">
        ${topics.length > 0 ? topics.map(t => `<span class="badge warning">${t}</span>`).join('') : '<p>Continue praticando para identificar pontos fracos!</p>'}
      </div>
    `;
  }

  onRestart(callback) {
    this.elements.restartBtn.addEventListener('click', callback);
  }

  onExport(callback) {
    this.elements.exportBtn.addEventListener('click', callback);
  }

  onHome(callback) {
    this.elements.homeBtn.addEventListener('click', callback);
  }
}
