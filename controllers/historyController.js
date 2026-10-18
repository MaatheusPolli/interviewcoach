import { summarizeProgress } from '../services/gamificationService.js';

export class HistoryController {
  constructor(storageService, historyView) {
    this.storage = storageService;
    this.view = historyView;
  }

  async showHistory() {
    const sessions = await this.storage.getAllSessions();
    // Calcula antes de inverter: o progresso depende da ordem cronológica
    const progress = summarizeProgress(sessions);
    this.view.show(sessions.reverse(), progress); // Newest first
  }
}
