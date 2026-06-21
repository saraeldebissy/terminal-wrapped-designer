import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CoverSlide } from './CoverSlide';
import { fullStats } from '../test/fixtures';

describe('CoverSlide', () => {
  it('renders the cover title', () => {
    render(<CoverSlide stats={fullStats} />);
    expect(screen.getByText(/you & your shell/i)).toBeInTheDocument();
  });
});
