import { ThumbnailData, VTTCue } from '../types';
import { VTTParser } from '../VTTParser';

export class ThumbnailManager {
  private thumbnails: ThumbnailData[] = [];
  private parser: VTTParser;
  private basePath: string;

  constructor(basePath: string = '') {
    this.parser = new VTTParser();
    this.basePath = basePath;
  }

  async loadVTT(url: string): Promise<void> {
    try {
      const response = await fetch(url);
      const content = await response.text();
      const cues = this.parser.parse(content);

      this.thumbnails = cues.map(cue => this.createThumbnailData(cue));
    } catch (error) {
      console.error('Failed to load VTT file:', error);
      throw error;
    }
  }

  getThumbnailAt(time: number): ThumbnailData | null {
    return this.thumbnails.find(
      thumb => time >= thumb.startTime && time <= thumb.endTime,
    ) || null;
  }

  dispose(): void {
    this.thumbnails = [];
  }

  private createThumbnailData(cue: VTTCue): ThumbnailData {
    const url = this.basePath ? `${this.basePath}/${cue.text}` : cue.text;

    return {
      startTime: cue.startTime,
      endTime: cue.endTime,
      url,
    };
  }
}