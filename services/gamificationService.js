// Ready Score e badges locais, calculados a partir do histórico de sessões.
// Função pura: não acessa IndexedDB nem DOM.

export const RECENT_WINDOW = 5;
export const SPECIALIST_MIN_SESSIONS = 3;
export const SPECIALIST_MIN_AVERAGE = 70;

const TRACK_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  data: 'Dados',
  mobile: 'Mobile',
  devops: 'DevOps'
};

const average = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * @param {Array<{track: string, overallScore: number}>} sessions
 * @returns {{ readyScore: number, sessionCount: number, badges: Array<{id: string, label: string}> }}
 */
export function summarizeProgress(sessions = []) {
  const valid = sessions.filter(s => typeof s?.overallScore === 'number' && Number.isFinite(s.overallScore));
  const badges = [];

  if (valid.length === 0) {
    return { readyScore: 0, sessionCount: 0, badges };
  }

  // Média das últimas sessões: reflete o nível atual, não o histórico inteiro
  const recent = valid.slice(-RECENT_WINDOW);
  const readyScore = Math.round(average(recent.map(s => s.overallScore)));

  if (valid.length >= 1) badges.push({ id: 'first-session', label: 'Primeira entrevista' });
  if (valid.length >= 5) badges.push({ id: 'consistent', label: 'Constância: 5 entrevistas' });
  if (valid.some(s => s.overallScore >= 80)) badges.push({ id: 'sharp', label: 'Nota 80+ em uma sessão' });

  for (const [track, label] of Object.entries(TRACK_LABELS)) {
    const scores = valid.filter(s => s.track === track).map(s => s.overallScore);
    if (scores.length >= SPECIALIST_MIN_SESSIONS && average(scores) >= SPECIALIST_MIN_AVERAGE) {
      badges.push({ id: `specialist-${track}`, label: `Especialista em ${label}` });
    }
  }

  return { readyScore, sessionCount: valid.length, badges };
}
