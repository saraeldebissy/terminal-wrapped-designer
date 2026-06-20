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
});
