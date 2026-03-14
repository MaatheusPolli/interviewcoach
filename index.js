import { AIService } from './services/aiService.js';
import { VoiceService } from './services/voiceService.js';
import { StorageService } from './services/storageService.js';
import { ScoringService } from './services/scoringService.js';

import { InterviewView } from './views/interviewView.js';
import { FeedbackView } from './views/feedbackView.js';
import { DashboardView } from './views/dashboardView.js';
import { HistoryView } from './views/historyView.js';

import { SessionController } from './controllers/sessionController.js';
import { HistoryController } from './controllers/historyController.js';

(async function main() {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registrado com sucesso');
    } catch (e) {
      console.error('Falha ao registrar Service Worker', e);
    }
  }

  // Theme Toggle Logic
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  const currentTheme = localStorage.getItem('theme') || 'light';
  if (currentTheme === 'dark') {
    body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const theme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌓';
  });

  // Initialize Services
  const aiService = new AIService();
  const voiceService = new VoiceService();
  const storageService = new StorageService();
  const scoringService = new ScoringService();

  // Initialize Views
  const interviewView = new InterviewView();
  const feedbackView = new FeedbackView();
  const dashboardView = new DashboardView();
  const historyView = new HistoryView();

  // Initialize Controllers
  const sessionController = new SessionController(
    { ai: aiService, voice: voiceService, storage: storageService, scoring: scoringService },
    { interview: interviewView, feedback: feedbackView, dashboard: dashboardView }
  );

  const historyController = new HistoryController(storageService, historyView);

  // Check Requirements
  const { errors, availability } = await aiService.checkRequirements();
  
  if (errors || availability === 'after-download') {
    const errorOverlay = document.getElementById('error-overlay');
    const errorTitle = document.getElementById('error-title');
    const errorList = document.getElementById('error-list');
    const downloadContainer = document.getElementById('download-progress-container');
    const downloadFill = document.getElementById('download-progress-fill');
    const downloadStatus = document.getElementById('download-status');
    const errorFooter = document.getElementById('error-footer');

    if (errors) {
      errorList.innerHTML = errors.map(err => `<li>${err}</li>`).join('');
      errorOverlay.classList.remove('hidden');
      return;
    }

    if (availability === 'after-download') {
      errorTitle.textContent = '📦 Preparando Ambiente de IA';
      errorList.classList.add('hidden');
      downloadContainer.classList.remove('hidden');
      errorFooter.textContent = 'Isso acontece apenas na primeira vez. O download tem ~1.5GB.';
      errorOverlay.classList.remove('hidden');

      const success = await aiService.downloadModel((percent) => {
        downloadFill.style.width = `${percent}%`;
        downloadStatus.textContent = `${percent}%`;
      });

      if (success) {
        errorOverlay.classList.add('hidden');
      } else {
        errorTitle.textContent = '⚠️ Falha no Download';
        errorFooter.textContent = 'Tente recarregar a página ou verifique sua conexão.';
      }
    }
  }

  // Home Screen Elements
  const startBtn = document.getElementById('start-btn');
  const viewHistoryBtn = document.getElementById('view-history-btn');
  const trackSelect = document.getElementById('track-select');
  const levelSelect = document.getElementById('level-select');
  const modeSelect = document.getElementById('mode-select');
  const languageSelect = document.getElementById('language-select');
  const jdInput = document.getElementById('jd-input');
  const yearSpan = document.getElementById('year');

  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Navigation Event Listeners
  startBtn.addEventListener('click', () => {
    const config = {
      track: trackSelect.value,
      level: levelSelect.value,
      mode: modeSelect.value,
      language: languageSelect.value,
      jd: jdInput.value.trim()
    };
    sessionController.init(config);
  });

  viewHistoryBtn.addEventListener('click', () => {
    historyController.showHistory();
  });

  historyView.onBack(() => {
    window.location.reload(); // Simple reload to go home
  });

  console.log('InterviewCoach initialized successfully');
})();
