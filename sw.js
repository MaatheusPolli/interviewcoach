const CACHE_NAME = 'interviewcoach-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './index.js',
  './manifest.json',
  './SKILL.md',
  './services/aiService.js',
  './services/voiceService.js',
  './services/storageService.js',
  './services/scoringService.js',
  './controllers/sessionController.js',
  './controllers/historyController.js',
  './views/interviewView.js',
  './views/feedbackView.js',
  './views/dashboardView.js',
  './views/historyView.js',
  './data/questions-frontend.json',
  './data/questions-backend.json',
  './data/questions-data.json',
  './data/questions-mobile.json',
  './data/questions-devops.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
