import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptSlide } from './ReceiptSlide';
import { fullStats } from '../test/fixtures';

describe('ReceiptSlide', () => {
  it('renders summary rows and a download button', () => {
    render(<ReceiptSlide stats={fullStats} />);
    expect(screen.getByText('commands run')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /download your wrapped/i })).toBeInTheDocument();
  });

  it('renders 0 secrets leaked when secrets section is absent', () => {
    const legacy = { ...fullStats } as Record<string, unknown>;
    delete legacy.secrets;
    render(<ReceiptSlide stats={legacy as unknown as import('../api/types').Stats} />);
    expect(screen.getByText('secrets leaked')).toBeInTheDocument();
  });
});
