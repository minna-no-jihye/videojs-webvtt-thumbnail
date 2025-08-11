export interface VTTCue {
  startTime: number;
  endTime: number;
  text: string;
}

export interface VTTThumbnailOptions {
  src: string;
  width?: number;
  height?: number;
}

export interface ThumbnailCue extends VTTCue {
  imageUrl?: string;
  coordinates?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}



