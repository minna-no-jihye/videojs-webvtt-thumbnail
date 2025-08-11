import 'video.js';
import type Player from 'video.js/dist/types/player';

declare module 'video.js/dist/types/player' {
  interface Player {
    controlBar?: {
      progressControl?: {
        el(): HTMLElement;
        seekBar?: {
          el(): HTMLElement;
        };
      };
    };
  }
}