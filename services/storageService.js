export class StorageService {
  constructor() {
    this.dbName = 'InterviewCoachDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        reject('Error opening database');
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store: sessions
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        }

        // Store: weakTopics
        if (!db.objectStoreNames.contains('weakTopics')) {
          db.createObjectStore('weakTopics', { keyPath: 'topic' });
        }
      };
    });
  }

  async saveSession(sessionData) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readwrite');
      const store = transaction.objectStore('sessions');
      const request = store.add(sessionData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error saving session');
    });
  }

  async getAllSessions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['sessions'], 'readonly');
      const store = transaction.objectStore('sessions');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Error fetching sessions');
    });
  }

  async updateWeakTopics(topics) {
    if (!this.db) await this.init();

    const transaction = this.db.transaction(['weakTopics'], 'readwrite');
    const store = transaction.objectStore('weakTopics');

    for (const topicData of topics) {
      store.put(topicData);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject('Error updating weak topics');
    });
  }

  async getWeakTopics() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['weakTopics'], 'readonly');
      const store = transaction.objectStore('weakTopics');
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by averageScore ascending to get weakest topics
        const sorted = request.result.sort((a, b) => a.averageScore - b.averageScore);
        resolve(sorted.slice(0, 3));
      };
      request.onerror = () => reject('Error fetching weak topics');
    });
  }

  exportData(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
