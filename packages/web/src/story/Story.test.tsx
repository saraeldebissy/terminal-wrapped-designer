import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Story } from './Story';
import { fullStats } from '../test/fixtures';

// jsdom default window.innerWidth = 1024
// Left zone: clientX < 341 (1024/3)
// Right zone: clientX >= 341

function getProgressBar() {
  return screen.getByRole('progressbar');
}

function progressNow() {
  return Number(getProgressBar().getAttribute('aria-valuenow'));
}

describe('Story engine', () => {
  it('renders the cover slide first', async () => {
    render(<Story stats={fullStats} />);
    // Cover slide title
    expect(await screen.findByText(/you and your shell had a year/i)).toBeInTheDocument();
    expect(progressNow()).toBe(1);
  });

  it('advances on a click in the right zone', async () => {
    const { container } = render(<Story stats={fullStats} />);
    // Wait for initial render
    await screen.findByText(/you and your shell had a year/i);
    const main = container.querySelector('main')!;
    fireEvent.click(main, { clientX: 800 });
    // Should be on slide 2 (volume) — progress bar reflects the new index
    await waitFor(() => expect(progressNow()).toBe(2));
  });

  it('goes back on a click in the left zone', async () => {
    const { container } = render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);
    const main = container.querySelector('main')!;

    // Advance to slide 2
    fireEvent.click(main, { clientX: 800 });
    await waitFor(() => expect(progressNow()).toBe(2));

    // Go back
    fireEvent.click(main, { clientX: 50 });
    await waitFor(() => expect(progressNow()).toBe(1));
    expect(await screen.findByText(/you and your shell had a year/i)).toBeInTheDocument();
  });

  it('advances on ArrowRight and goes back on ArrowLeft', async () => {
    render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    await waitFor(() => expect(progressNow()).toBe(2));

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    await waitFor(() => expect(progressNow()).toBe(1));
  });

  it('the receipt Download button is clickable and does NOT advance the story', async () => {
    render(<Story stats={fullStats} />);
    await screen.findByText(/you and your shell had a year/i);

    // Navigate to the last slide (receipt — slide 9 with fullStats)
    // Keep pressing ArrowRight until "Download your Wrapped" appears
    const maxSlides = 9;
    for (let i = 1; i < maxSlides; i++) {
      fireEvent.keyDown(window, { key: 'ArrowRight' });
    }

    // Wait for the Download button to appear on the receipt slide
    const downloadBtn = await screen.findByRole('button', { name: /download your wrapped/i });
    expect(downloadBtn).toBeInTheDocument();

    // Capture current valuenow (should be at the last slide)
    const valueBefore = progressNow();

    // Click the Download button — must NOT trigger navigation
    fireEvent.click(downloadBtn);

    // Give React a tick to process any state changes
    await waitFor(() => {
      expect(progressNow()).toBe(valueBefore);
    });
  });
});
