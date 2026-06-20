import type { FC } from 'react';
import type { SlideId, SlideViewProps } from './types';
import { CoverSlide } from './CoverSlide';
import { VolumeSlide } from './VolumeSlide';
import { TypeSlide } from './TypeSlide';
import { PeakHourSlide } from './PeakHourSlide';
import { BusiestDaySlide } from './BusiestDaySlide';
import { FlagSlide } from './FlagSlide';
import { CountdownSlide } from './CountdownSlide';
import { SecretsSlide } from './SecretsSlide';
import { ReceiptSlide } from './ReceiptSlide';

export const SLIDE_REGISTRY: Record<SlideId, FC<SlideViewProps>> = {
  cover: CoverSlide,
  volume: VolumeSlide,
  type: TypeSlide,
  peakHour: PeakHourSlide,
  busiestDay: BusiestDaySlide,
  flag: FlagSlide,
  countdown: CountdownSlide,
  secrets: SecretsSlide,
  receipt: ReceiptSlide,
};
