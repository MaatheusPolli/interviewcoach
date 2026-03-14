// Score aggregation across a session
export class ScoringService {
  calculateSessionScore(questionResults) {
    if (!questionResults.length) return null;

    const byTopic = {};
    const dimensionTotals = { accuracy: 0, depth: 0, clarity: 0, examples: 0, bestPractices: 0 };

    questionResults.forEach(r => {
      if (!byTopic[r.topic]) byTopic[r.topic] = [];
      byTopic[r.topic].push(r.totalScore);

      // Aggregate dimensions
      if (r.scores) {
        dimensionTotals.accuracy += r.scores.accuracy || 0;
        dimensionTotals.depth += r.scores.depth || 0;
        dimensionTotals.clarity += r.scores.clarity || 0;
        dimensionTotals.examples += r.scores.examples || 0;
        dimensionTotals.bestPractices += r.scores.bestPractices || 0;
      }
    });

    const average = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const overall = average(questionResults.map(r => r.totalScore));
    
    const dimensionAverages = {
      accuracy: dimensionTotals.accuracy / questionResults.length,
      depth: dimensionTotals.depth / questionResults.length,
      clarity: dimensionTotals.clarity / questionResults.length,
      examples: dimensionTotals.examples / questionResults.length,
      bestPractices: dimensionTotals.bestPractices / questionResults.length
    };

    const scoreByTopic = Object.fromEntries(
      Object.entries(byTopic).map(([t, scores]) => [t, average(scores)])
    );

    const weakestTopics = Object.entries(scoreByTopic)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    return {
      overall,
      dimensionAverages,
      byTopic: scoreByTopic,
      weakestTopics
    };
  }

  // Calculate Radar Chart coordinates
  getRadarData(scores) {
    // scores = { accuracy, depth, clarity, examples, bestPractices }
    const labels = ['Accuracy', 'Depth', 'Clarity', 'Examples', 'Best Practices'];
    const data = [
      scores.accuracy || 0,
      scores.depth || 0,
      scores.clarity || 0,
      scores.examples || 0,
      scores.bestPractices || 0
    ];
    return { labels, data };
  }
}
