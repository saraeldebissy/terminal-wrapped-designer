import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeSlide } from './TypeSlide';
import { fullStats } from '../test/fixtures';

describe('TypeSlide', () => {
  it('renders the percentage verdict for the top category', () => {
    render(<TypeSlide stats={fullStats} />);
    expect(screen.getByText(/62% version control creature/i)).toBeInTheDocument();
  });
});
