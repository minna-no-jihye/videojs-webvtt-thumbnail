import { ThumbnailCue, VTTCue, VTTThumbnailOptions } from '@/types';
import { VideojsControlBar } from '@/videojs.types';
import { VTTParser } from '@/VTTParser';
import videojs from 'video.js';
import type Player from 'video.js/dist/types/player';
import Plugin from 'video.js/dist/types/plugin';


const VideoJSPlugin = videojs.getPlugin('plugin') as typeof Plugin;

class VTTThumbnailsPlugin extends VideoJSPlugin {
  private options: VTTThumbnailOptions;
  private thumbnails: ThumbnailCue[] = [];
  private thumbnailElement?: HTMLDivElement;
  private imageElement?: HTMLImageElement;
  private timeElement?: HTMLDivElement;
  private vttParser: VTTParser;
  private progressControl?: any;
  private seekBar?: any;

  constructor(player: Player, options: VTTThumbnailOptions) {
    super(player);
    this.options = options;
    this.vttParser = new VTTParser();

    if (this.options.src) {
      this.loadThumbnails();
    }

    this.player.ready(() => {
      this.initializeUI();
    });
  }

  dispose(): void {
    if (this.thumbnailElement) {
      this.thumbnailElement.remove();
    }
    super.dispose();
  }

  private async loadThumbnails(): Promise<void> {
    try {
      const response = await fetch(this.options.src);
      const vttContent = await response.text();
      const cues = this.vttParser.parse(vttContent);
      this.thumbnails = this.transformToThumbnails(cues);
    } catch (error) {
      videojs.log.error('Failed to load VTT thumbnails:', error);
    }
  }

  private transformToThumbnails(cues: VTTCue[]): ThumbnailCue[] {
    return cues.map(cue => {
      const thumbnailCue: ThumbnailCue = {
        ...cue,
      };

      const lines = cue.text.split('\n');
      thumbnailCue.imageUrl = lines[0];

      return thumbnailCue;
    });
  }

  private initializeUI(): void {
    const controlBar = (this.player as any).controlBar as VideojsControlBar;
    this.progressControl = controlBar?.progressControl;
    this.seekBar = this.progressControl?.seekBar;

    if (!this.progressControl || !this.seekBar) {
      console.warn('ProgressControl or SeekBar not found');
      return;
    }

    this.createThumbnailElement();
    this.attachEventListeners();
  }

  private createThumbnailElement(): void {
    this.thumbnailElement = document.createElement('div');
    this.thumbnailElement.className = 'vjs-thumbnail-holder';
    this.thumbnailElement.style.cssText = `
      position: absolute;
      bottom: 100%;
      margin-bottom: 10px;
      background: rgba(0, 0, 0, 0.8);
      padding: 5px;
      border-radius: 4px;
      pointer-events: none;
      display: none;
      transform: translateX(-50%);
      z-index: 1000;
    `;

    this.imageElement = document.createElement('img');
    this.imageElement.style.cssText = `
      display: block;
      max-width: ${this.options?.width || 160}px;
      max-height: ${this.options?.height || 90}px;
    `;

    this.thumbnailElement.appendChild(this.imageElement);

    // if (this.options.showTimeStamp) {
    //   this.timeElement = document.createElement('div');
    //   this.timeElement.style.cssText = `
    //     color: white;
    //     text-align: center;
    //     padding-top: 5px;
    //     font-size: 12px;
    //   `;
    //   this.thumbnailElement.appendChild(this.timeElement);
    // }

    const progressHolder = this.progressControl.el();
    progressHolder.appendChild(this.thumbnailElement);
  }

  private attachEventListeners(): void {
    const progressHolder = this.progressControl.el();

    progressHolder.addEventListener('mousemove', this.handleMouseMove.bind(this));
    progressHolder.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    progressHolder.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }

  private handleMouseMove(event: MouseEvent): void {
    const progressHolder = this.progressControl.el();
    const rect = progressHolder.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const percentage = offsetX / rect.width;
    const duration = this.player.duration();

    if (!duration || !this.thumbnailElement) return;

    const currentTime = duration * percentage;
    const thumbnail = this.findThumbnailForTime(currentTime);

    if (thumbnail && this.imageElement) {
      if (thumbnail.coordinates) {
        this.imageElement.style.cssText = `
          display: block;
          width: ${thumbnail.coordinates.w}px;
          height: ${thumbnail.coordinates.h}px;
          background-image: url(${thumbnail.imageUrl});
          background-position: -${thumbnail.coordinates.x}px -${thumbnail.coordinates.y}px;
          max-width: ${this.options.width || 160}px;
          max-height: ${this.options.height || 90}px;
        `;
        this.imageElement.src = '';
      } else {
        this.imageElement.style.cssText = `
          display: block;
          max-width: ${this.options.width || 160}px;
          max-height: ${this.options.height || 90}px;
        `;
        this.imageElement.src = thumbnail.imageUrl || '';
      }
    }

    if (this.timeElement) {
      this.timeElement.textContent = this.formatTime(currentTime);
    }

    this.thumbnailElement.style.left = `${offsetX}px`;
  }

  private handleMouseEnter(): void {
    if (this.thumbnailElement) {
      this.thumbnailElement.style.display = 'block';
    }
  }

  private handleMouseLeave(): void {
    if (this.thumbnailElement) {
      this.thumbnailElement.style.display = 'none';
    }
  }

  private findThumbnailForTime(time: number): ThumbnailCue | undefined {
    return this.thumbnails.find(
      thumbnail => time >= thumbnail.startTime && time < thumbnail.endTime,
    );
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (hours > 0) {
      parts.push(hours.toString().padStart(2, '0'));
    }
    parts.push(minutes.toString().padStart(2, '0'));
    parts.push(secs.toString().padStart(2, '0'));

    return parts.join(':');
  }
}

videojs.registerPlugin('vttThumbnails', VTTThumbnailsPlugin);

export default VTTThumbnailsPlugin;