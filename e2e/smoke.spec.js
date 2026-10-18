import { test, expect } from '@playwright/test';

// Simula o Gemini Nano: a rubrica devolve um JSON válido cujo texto contém HTML
// malicioso, para provar que a tela escapa a saída do modelo.
const XSS = '<img src=x onerror="window.__xss=1">';

test.beforeEach(async ({ page }) => {
  await page.addInitScript((xss) => {
    const session = {
      prompt: async (text) => {
        if (text.includes('Return ONLY a JSON object')) {
          return JSON.stringify({
            totalScore: 7,
            scores: { accuracy: 7, depth: 6, clarity: 8, examples: 5, bestPractices: 7 },
            strengths: [xss],
            missing: ['Detalhe faltando'],
            improvement: 'Melhore os exemplos',
            modelAnswer: 'Resposta modelo'
          });
        }
        if (text.includes('ONE short hint') || text.includes('Give ONE short hint')) {
          return 'Pense no ciclo de vida do componente.';
        }
        // Tradução: devolve o texto original após o último ": "
        return text.slice(text.lastIndexOf(': ') + 2);
      }
    };
    window.LanguageModel = {
      availability: async () => 'available',
      create: async () => session
    };
  }, XSS);
});

test('fluxo completo: home, entrevista, dica, feedback seguro, dashboard e histórico', async ({ page }) => {
  await page.goto('/');

  // Filtro de tópicos é preenchido a partir da trilha
  await expect.poll(async () => page.locator('#topic-select option').count()).toBeGreaterThan(1);

  await page.click('#start-btn');
  await expect(page.locator('#interview-screen')).toBeVisible();

  // Dica aparece após ~5 s de silêncio
  await expect(page.locator('#hint-box')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator('#hint-box')).toContainText('Dica');

  for (let i = 0; i < 5; i++) {
    await page.fill('#answer-input', `Resposta ${i + 1}`);
    await page.click('#submit-answer-btn');
    await expect(page.locator('#feedback-screen')).toBeVisible();

    // Saída do modelo é exibida como texto, nunca executada
    await expect(page.locator('#feedback-content')).toContainText('<img src=x');
    expect(await page.evaluate(() => window.__xss)).toBeUndefined();

    await page.click('#next-question-btn');
    if (i < 4) await expect(page.locator('#interview-screen')).toBeVisible();
  }

  await expect(page.locator('#dashboard-screen')).toBeVisible();
  await expect(page.locator('#final-score')).not.toHaveText('0');
  await expect(page.locator('#radar-text li')).toHaveCount(5);

  // Volta ao início e confere o histórico com Ready Score
  await page.click('#home-btn');
  await expect(page.locator('#start-btn')).toBeVisible();
  await page.click('#view-history-btn');
  await expect(page.locator('#history-screen')).toBeVisible();
  await expect(page.locator('.progress-summary')).toContainText('Ready Score');
});
