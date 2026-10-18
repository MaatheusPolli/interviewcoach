// Pure validation of the feedback JSON returned by the model.
// Keeps the rubric contract in one place so it can be tested without a browser.

export const DIMENSIONS = ['accuracy', 'depth', 'clarity', 'examples', 'bestPractices'];

const isScore = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 10;
const isStringArray = (v) => Array.isArray(v) && v.every((item) => typeof item === 'string');

/**
 * Validates a parsed feedback object.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFeedback(feedback) {
  const errors = [];

  if (!feedback || typeof feedback !== 'object' || Array.isArray(feedback)) {
    return { valid: false, errors: ['feedback deve ser um objeto'] };
  }

  if (!isScore(feedback.totalScore)) {
    errors.push('totalScore ausente ou fora de 0-10');
  }

  if (!feedback.scores || typeof feedback.scores !== 'object') {
    errors.push('scores ausente');
  } else {
    for (const dim of DIMENSIONS) {
      if (!isScore(feedback.scores[dim])) {
        errors.push(`scores.${dim} ausente ou fora de 0-10`);
      }
    }
  }

  if (!isStringArray(feedback.strengths)) errors.push('strengths deve ser lista de textos');
  if (!isStringArray(feedback.missing)) errors.push('missing deve ser lista de textos');
  if (typeof feedback.improvement !== 'string') errors.push('improvement deve ser texto');
  if (typeof feedback.modelAnswer !== 'string') errors.push('modelAnswer deve ser texto');

  return { valid: errors.length === 0, errors };
}
