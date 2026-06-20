import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountdownSlide } from './CountdownSlide';
import { fullStats } from '../test/fixtures';

describe('CountdownSlide', () => {
  it('renders the #1 command and the branching-strategy payoff', () => {
    render(<CountdownSlide stats={fullStats} />);
    expect(screen.getByText('git')).toBeInTheDocument();
    expect(screen.getByText(/branching strategy/i)).toBeInTheDocument();
  });
});
