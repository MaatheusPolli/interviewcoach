// Mantenha a versão igual à de package.json: um teste verifica essa sincronia.
const CACHE_NAME = 'interviewcoach-v1.1.0';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './index.js',
  './manifest.json',
  './services/aiService.js',
  './services/feedbackSchema.js',
  './services/gamificationService.js',
  './services/voiceService.js',
  './services/storageService.js',
  './services/scoringService.js',
  './controllers/sessionController.js',
  './controllers/historyController.js',
  './views/interviewView.js',
  './views/feedbackView.js',
  './views/dashboardView.js',
  './views/historyView.js',
  './utils/html.js',
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

// Remove caches de versões anteriores para não servir JS antigo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('interviewcoach-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
