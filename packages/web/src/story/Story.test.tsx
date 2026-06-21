import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Story } from './Story';
import { fullStats } from '../test/fixtures';

// jsdom default window.innerWidth = 1024
// Left zone: clientX < 341 (1024/3)
// Right zone: clientX >= 341

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProgressBar() {
  return screen.getByRole('progressbar');
}

function progressNow() {
  return Number(getProgressBar().getAttribute('aria-valuenow'));
}

/**
 * Press ArrowRight and wait until unique text from the target slide appears.
 * Using slide TEXT as the signal (not progressbar) guarantees the slide DOM
 * has actually mounted — progressbar updates synchronously but the slide
 * content may still be in AnimatePresence's exit/enter queue.
 */
async function pressRightUntil(text: string | RegExp) {
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  await screen.findByText(text);
}

// Unique kicker text for each slide in fullStats order.
// Slide 1: cover — "You and your shell had a year"
// Slide 2: volume
const VOLUME_TEXT = /this year you ran/i;
// Slide 3: type
const TYPE_TEXT = /turns out you/i;
// Slide 4: peakHour
const PEAK_TEXT = /your terminal runs hottest at/i;
// Slide 5: busiestDay
const BUSIEST_TEXT = /your most unhinged day/i;
// Slide 6: flag
const FLAG_TEXT = /your most-reached-for flag/i;
// Slide 7: countdown
const COUNTDOWN_TEXT = /your top commands\. drumroll/i;
// Slide 8: secrets
const SECRETS_TEXT = /we found/i;
// Slide 9: receipt
const RECEIPT_TEXT = /that.s your year in the terminal/i;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Story engine', () => {
  it('renders the cover slide first', async () => {
    render(<Story stats={fullStats} />);
    // findByText retries through the enter animation
    expect(await screen.findByText(/you and your shell had a year/i)).toBeInTheDocument();
    // progressbar can be checked after the text confirms the slide is mounted
    await waitFor(() => {
      expect(progressNow()).toBe(1);
    });
  });

  it('advances on a click in the right zone', async () => {
    const { container } = render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);
    const main = container.querySelector('main')!;

    fireEvent.click(main, { clientX: 800 });
    // Wait for the volume slide's unique content — proves the slide mounted
    await screen.findByText(VOLUME_TEXT);
    await waitFor(() => expect(progressNow()).toBe(2));
  });

  it('goes back on a click in the left zone', async () => {
    const { container } = render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);
    const main = container.querySelector('main')!;

    // Advance to slide 2 — wait for its unique content
    fireEvent.click(main, { clientX: 800 });
    await screen.findByText(VOLUME_TEXT);

    // Go back — wait for cover text to re-appear (not present on slide 2)
    fireEvent.click(main, { clientX: 50 });
    expect(await screen.findByText(/you and your shell had a year/i)).toBeInTheDocument();
    await waitFor(() => expect(progressNow()).toBe(1));
  });

  it('advances on ArrowRight and goes back on ArrowLeft', async () => {
    render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);

    // Advance — wait for slide 2 unique content
    await pressRightUntil(VOLUME_TEXT);
    await waitFor(() => expect(progressNow()).toBe(2));

    // Go back — wait for cover text to re-appear
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(await screen.findByText(/you and your shell had a year/i)).toBeInTheDocument();
    await waitFor(() => expect(progressNow()).toBe(1));
  });

  // ---------------------------------------------------------------------------
  // C1 structural guard — old full-screen overlay nav buttons must NOT exist
  // ---------------------------------------------------------------------------
  it('does NOT render full-screen overlay nav buttons (C1 regression guard)', () => {
    render(<Story stats={fullStats} />);
    // In the old broken implementation, invisible full-screen button overlays
    // existed with these accessible names. The new click-zone design must NOT
    // have these buttons — this assertion fails against the old broken code.
    expect(screen.queryByRole('button', { name: /next slide/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /previous slide/i })).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Download button — present on receipt, does NOT advance the story
  // ---------------------------------------------------------------------------
  it('the receipt Download button is present and does NOT advance the story', async () => {
    render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);

    // Navigate through all 8 transitions, waiting for each slide's unique
    // content to confirm the DOM has mounted before firing the next event.
    // This is the only reliable way to drive AnimatePresence mode="wait"
    // without racing the animation queue.
    await pressRightUntil(VOLUME_TEXT);
    await pressRightUntil(COUNTDOWN_TEXT);
    await pressRightUntil(TYPE_TEXT);
    await pressRightUntil(PEAK_TEXT);
    await pressRightUntil(BUSIEST_TEXT);
    await pressRightUntil(SECRETS_TEXT);
    await pressRightUntil(FLAG_TEXT);
    await pressRightUntil(RECEIPT_TEXT);

    // Confirm we're on the receipt slide
    await waitFor(() => expect(progressNow()).toBe(9));

    // Download button must be visible
    const downloadBtn = screen.getByRole('button', { name: /download your wrapped/i });
    expect(downloadBtn).toBeInTheDocument();

    const valueBefore = progressNow();
    expect(valueBefore).toBe(9);

    // Click the Download button — must NOT trigger navigation
    fireEvent.click(downloadBtn);

    // Give React a tick to process any state changes
    await waitFor(() => {
      expect(progressNow()).toBe(valueBefore);
    });
  });
});
