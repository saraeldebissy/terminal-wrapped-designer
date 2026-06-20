import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VolumeSlide } from './VolumeSlide';
import { fullStats } from '../test/fixtures';

describe('VolumeSlide', () => {
  it('renders the commands label and distinct-tools aside', () => {
    render(<VolumeSlide stats={fullStats} />);
    expect(screen.getByText('commands')).toBeInTheDocument();
    expect(screen.getByText(/35 different tools/i)).toBeInTheDocument();
  });
});
