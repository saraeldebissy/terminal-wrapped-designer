import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BusiestDaySlide } from './BusiestDaySlide';
import { fullStats } from '../test/fixtures';

describe('BusiestDaySlide', () => {
  it('renders the busiest day and its command count', () => {
    render(<BusiestDaySlide stats={fullStats} />);
    expect(screen.getByText(/June 14/i)).toBeInTheDocument();
    expect(screen.getByText(/183 commands/i)).toBeInTheDocument();
  });
});
