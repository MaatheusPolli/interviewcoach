export class HistoryController {
  constructor(storageService, historyView) {
    this.storage = storageService;
    this.view = historyView;
  }

  async showHistory() {
    const sessions = await this.storage.getAllSessions();
    this.view.show(sessions.reverse()); // Newest first
  }
}
