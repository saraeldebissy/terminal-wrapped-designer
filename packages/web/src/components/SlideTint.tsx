import { createContext, useContext } from 'react';

/**
 * The current slide's locked text color (a hex like "#FFFFFF" or "#0A0A0A").
 * Slide provides it; chart/decor children read it so their faint tints track
 * the background without each component re-deriving it from the palette token.
 */
export const SlideTintContext = createContext<string>('#FFFFFF');

export const useSlideTint = (): string => useContext(SlideTintContext);
