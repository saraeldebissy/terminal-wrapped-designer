import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SecretsSlide } from './SecretsSlide';
import { fullStats } from '../test/fixtures';

describe('SecretsSlide', () => {
  it('renders the count, plaintext verdict, and the one-word punchline', () => {
    render(<SecretsSlide stats={fullStats} />);
    expect(screen.getByText(/plaintext/i)).toBeInTheDocument();
    expect(screen.getByText('Bold.')).toBeInTheDocument();
  });
});
