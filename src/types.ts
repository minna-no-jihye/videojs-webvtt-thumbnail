export interface VTTThumbnailOptions {
  /**
   * vtt thumbnail file source
   */
  src: string;
  width?: number;
  height?: number;
  basePath?: string;
}

export interface VTTCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface ThumbnailData {
  startTime: number;
  endTime: number;
  url: string;
}



