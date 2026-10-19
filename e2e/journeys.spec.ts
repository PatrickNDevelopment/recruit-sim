import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const nav = (page: Page) => page.getByRole('navigation', { name: 'Sections' });

async function fresh(page: Page) {
  await page.goto('./');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'RecruitSim' })).toBeVisible();
}

async function start(page: Page, scenario: 'client-discovery' | 'candidate-screening') {
  await nav(page).getByRole('link', { name: 'Scenarios' }).click();
  await page
    .locator(`[data-scenario="${scenario}"]`)
    .getByRole('button', { name: 'Start a new attempt' })
    .click();
  await expect(page.locator('.step')).toBeVisible();
}

async function pick(page: Page, choiceId: string) {
  await page.locator(`[data-choice="${choiceId}"]`).click();
}

const STRONG_CLIENT = [
  'research',
  'slow-down',
  'calibrate',
  'range-in-writing',
  'decline-escalate',
  'written-terms',
  'summary',
];

test.beforeEach(async ({ page }) => {
  await fresh(page);
});

test('journey 1: a weak answer has a realistic consequence; review; replay a stronger branch', async ({
  page,
}) => {
  await expect(page.getByTestId('sample-banner')).toContainText('Practice only, fictional data.');
  await start(page, 'client-discovery');
  await pick(page, 'research');
  await expect(page.getByRole('heading', { name: 'What happened (step 1)' })).toBeFocused();
  await page.getByRole('button', { name: /I’ll send five CVs this afternoon/ }).click();
  await expect(page.getByText('Weak choice')).toBeVisible();
  await expect(page.locator('.feedback .explanation')).toContainText(
    'you have not asked any candidate',
  );
  await pick(page, 'send-now');
  await expect(page.getByTestId('ending')).toHaveText('Ending: Trust lost before the search began');
  await expect(page.getByTestId('consequences')).toContainText('complains to your agency');
  await expect(page.getByTestId('readiness')).toHaveText('Not ready');
  await expect(page.locator('[data-item="consent"]')).toContainText(
    'Recorded: CVs sent without the candidates’ consent',
  );
  await expect(page.locator('[data-dimension="consent"]')).toContainText('Needs work');
  await expect(page.locator('table')).not.toContainText('%');

  // Review explanations and mistakes.
  await page.getByRole('link', { name: 'Review explanations and mistakes' }).click();
  const mistakes = page.locator('.mistakes > li');
  await expect(mistakes).toHaveCount(2);
  await expect(mistakes.first()).toContainText('A stronger option: “I can move fast.');
  await expect(mistakes.nth(1)).toContainText(
    'Their personal data is now with a company they never chose',
  );

  // Replay from step 2 with the stronger branch.
  await mistakes.first().getByRole('button', { name: 'Replay from step 2' }).click();
  await expect(page.getByRole('status')).toContainText('Replaying from step 2');
  await expect(page.locator('.step')).toHaveAttribute('data-node', 'opening');
  for (const c of STRONG_CLIENT.slice(1)) await pick(page, c);
  await expect(page.getByTestId('ending')).toHaveText('Ending: Call wrap-up');
  await expect(page.getByTestId('readiness')).toHaveText('Ready');
  await page.getByRole('button', { name: 'Try to start the search (practice)' }).click();
  await expect(page.getByTestId('submit-result')).toContainText('Practice check passed');
  await expect(page.getByTestId('consequences')).toContainText('The brief is corrected in writing');

  // Both attempts are in the history.
  await nav(page).getByRole('link', { name: 'History' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(2);
  await expect(page.locator('tbody tr').first()).toContainText('replay');
  await expect(page.locator('tbody tr').nth(1)).toContainText('Trust lost before the search began');
});

test('journey 2: screening without consent cannot pass submission readiness', async ({ page }) => {
  await start(page, 'candidate-screening');
  for (const c of [
    'prepare',
    'explain',
    'probe',
    'honest',
    'respect',
    'assume',
    'flag',
    'next-steps',
  ])
    await pick(page, c);
  await expect(page.getByTestId('ending')).toHaveText('Ending: End of the screening call');
  await expect(page.getByTestId('readiness')).toHaveText('Not ready');
  await expect(page.locator('.checklist li.fail')).toHaveCount(1);
  await expect(page.locator('[data-item="consent"]')).toHaveClass(/fail/);
  await page.getByRole('button', { name: 'Try to submit the candidate (practice)' }).click();
  await expect(page.getByTestId('submit-result')).toHaveText(
    'Blocked. Submission readiness is not met: Candidate consented to this specific submission.',
  );
  // Good rubric bands elsewhere do not change readiness.
  await expect(page.locator('[data-dimension="relevance"]')).toContainText(
    'Meets the practice standard',
  );

  // Respecting the candidate's "not yet" and asking again later passes.
  await page.getByRole('button', { name: 'Replay from step 6 (Consent)' }).click();
  for (const c of ['ask', 'hold', 'confirm', 'flag', 'next-steps']) await pick(page, c);
  await expect(page.getByTestId('readiness')).toHaveText('Ready');
  await page.getByRole('button', { name: 'Try to submit the candidate (practice)' }).click();
  await expect(page.getByTestId('submit-result')).toContainText('Practice check passed');
});

test('pressured consent and a refusal pushed through are blocked too', async ({ page }) => {
  await start(page, 'candidate-screening');
  for (const c of ['prepare', 'explain', 'probe', 'honest', 'respect', 'ask']) await pick(page, c);
  await expect(page.locator('blockquote.line')).toContainText(
    'Not yet. I want to see a confirmed salary range',
  );
  await pick(page, 'pressure');
  for (const c of ['flag', 'next-steps']) await pick(page, c);
  await expect(page.locator('[data-item="consent"]')).toContainText('Recorded: Consent pressured');
  await expect(page.getByTestId('readiness')).toHaveText('Not ready');
});

test('keyboard only: play a whole scenario with Tab and Enter; focus follows each step', async ({
  page,
}) => {
  await start(page, 'client-discovery');
  for (const id of STRONG_CLIENT) {
    let found = false;
    for (let i = 0; i < 30 && !found; i += 1) {
      await page.keyboard.press('Tab');
      found =
        (await page.evaluate(() => document.activeElement?.getAttribute('data-choice'))) === id;
    }
    expect(found, `reached ${id} by Tab`).toBe(true);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /What happened/ })).toBeFocused();
  }
  await expect(page.getByTestId('readiness')).toHaveText('Ready');
  const outline = await page.evaluate(
    () => getComputedStyle(document.activeElement as Element).outlineStyle,
  );
  expect(outline).not.toBe('none');
});

test('coaching shows what is missing before the suggestion and does not change the evaluation', async ({
  page,
}) => {
  await start(page, 'client-discovery');
  await page.getByRole('button', { name: 'Show coaching for this step' }).click();
  const coach = page.getByTestId('coach');
  const headings = await coach.locator('h4').allTextContents();
  expect(headings).toEqual(['What is still missing', 'What you know', 'Suggested next action']);
  await expect(coach).toContainText('Who decides on the hire and how');
  for (const c of ['research', 'promise-cvs', 'send-now']) await pick(page, c);
  await expect(page.locator('[data-dimension="preparation"]')).toContainText('Developingsum +1');
  await page.getByRole('link', { name: 'Review explanations and mistakes' }).click();
  await expect(page.getByText('coaching opened 1 time')).toBeVisible();
});

test('progress is saved: resume after a reload; glossary links work; history can be cleared', async ({
  page,
}) => {
  await start(page, 'candidate-screening');
  await pick(page, 'prepare');
  await pick(page, 'explain');
  await page.locator('.feedback').getByRole('link', { name: 'Consent to submit' }).click();
  await expect(page.locator('#term-consent-to-submit')).toBeFocused();
  await page.reload();
  await nav(page).getByRole('link', { name: 'Scenarios' }).click();
  await page
    .locator('[data-scenario="candidate-screening"]')
    .getByRole('link', { name: 'Resume (step 3)' })
    .click();
  await expect(page.locator('.step')).toHaveAttribute('data-node', 'experience');
  await nav(page).getByRole('link', { name: 'History' }).click();
  await expect(page.locator('tbody tr')).toContainText('In progress (step 3)');
  await page.getByRole('button', { name: 'Clear history' }).click();
  await page.getByRole('button', { name: 'Yes, delete all' }).click();
  await expect(page.getByText('No attempts yet.')).toBeVisible();
});

test('a corrupted or forged history is kept aside and reported', async ({ page }) => {
  const forged = JSON.stringify({
    schema: 'recruit-sim.history',
    version: 1,
    current: null,
    attempts: [
      {
        id: 'x',
        scenarioId: 'candidate-screening',
        startedAt: 't',
        finishedAt: 't',
        steps: [{ nodeId: 'close', choiceId: 'next-steps' }],
        coachViews: 0,
        replayOf: null,
      },
    ],
  });
  await page.evaluate((v) => localStorage.setItem('recruit-sim.history.v1', v), forged);
  await page.reload();
  await expect(page.getByRole('alert').first()).toContainText(
    'Your saved history could not be read',
  );
  expect(await page.evaluate(() => localStorage.getItem('recruit-sim.history.v1.corrupt'))).toBe(
    forged,
  );
  await page.goto('./#/play/x');
  await expect(page.getByText('That attempt is not in this browser’s history.')).toBeVisible();
});

test('mobile width has no horizontal page scroll', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await start(page, 'candidate-screening');
  for (const c of ['prepare', 'explain', 'accept', 'invent', 'press', 'assume', 'reassure', 'soon'])
    await pick(page, c);
  const pages = ['#/play/', '#/', '#/history', '#/rubric', '#/glossary', '#/about'];
  const playUrl = page.url();
  for (const p of pages) {
    if (p !== '#/play/') await page.goto(`./${p}`);
    else await page.goto(playUrl);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, p).toBeLessThanOrEqual(0);
  }
});

test('screenshots for the docs', async ({ page }) => {
  const dir = join(process.cwd(), 'docs', 'screenshots');
  mkdirSync(dir, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: join(dir, 'home-desktop.png'), fullPage: true });
  await start(page, 'client-discovery');
  await pick(page, 'research');
  await page.getByRole('button', { name: 'Show coaching for this step' }).click();
  await page.screenshot({ path: join(dir, 'play-desktop.png'), fullPage: true });
  for (const c of ['promise-cvs', 'send-now']) await pick(page, c);
  await page.screenshot({ path: join(dir, 'ending-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'Review explanations and mistakes' }).click();
  await page.screenshot({ path: join(dir, 'review-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await start(page, 'candidate-screening');
  await pick(page, 'prepare');
  await page.screenshot({ path: join(dir, 'play-mobile.png'), fullPage: true });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: join(dir, 'play-dark.png'), fullPage: true });
});
