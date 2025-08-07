import videojs from 'video.js';

declare module 'video.js' {
  interface VideoJsPlayer {
    webvttThumbnails(options: WebvttThumbnailsOptions): WebvttThumbnails;
  }
}

export interface WebvttThumbnailsOptions {
  src: string;
  showOnHover?: boolean;
}

export default class WebvttThumbnails extends videojs.Plugin {
  constructor(player: videojs.Player, options: WebvttThumbnailsOptions);
  dispose(): void;
}