import Player from 'video.js/dist/types/player';
import { IThumbnailManager, IThumbnailViewer } from '../types';

export class ProgressBarHandler {
    private player: Player;
    private thumbnailManager: IThumbnailManager;
    private thumbnailViewer: IThumbnailViewer;
    private progressControl: Element | null = null;
    private seekBar: Element | null = null;
    private isHovering: boolean = false;
    private rafId: number | null = null;
    private lastMouseX: number = 0;

    constructor(
        player: Player,
        thumbnailManager: IThumbnailManager,
        thumbnailViewer: IThumbnailViewer
    ) {
        this.player = player;
        this.thumbnailManager = thumbnailManager;
        this.thumbnailViewer = thumbnailViewer;
        
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
    }

    initialize(): void {
        this.progressControl = this.player.controlBar.progressControl.el();
        this.seekBar = this.progressControl?.querySelector('.vjs-progress-holder') || null;

        if (this.seekBar) {
            this.seekBar.addEventListener('mouseenter', this.handleMouseEnter);
            this.seekBar.addEventListener('mouseleave', this.handleMouseLeave);
            this.seekBar.addEventListener('mousemove', this.handleMouseMove);
        }
    }

    private handleMouseEnter(): void {
        this.isHovering = true;
    }

    private handleMouseLeave(): void {
        this.isHovering = false;
        this.thumbnailViewer.hide();
        
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.isHovering || !this.seekBar) return;

        this.lastMouseX = event.clientX;
        
        if (this.rafId === null) {
            this.rafId = requestAnimationFrame(() => {
                this.updateThumbnail();
                this.rafId = null;
            });
        }
    }

    private updateThumbnail(): void {
        if (!this.seekBar) return;

        const rect = this.seekBar.getBoundingClientRect();
        const x = Math.max(0, Math.min(this.lastMouseX - rect.left, rect.width));
        const percentage = x / rect.width;
        const duration = this.player.duration();
        
        if (!duration || isNaN(duration)) return;

        const time = percentage * duration;
        const thumbnail = this.thumbnailManager.getThumbnailAt(time);

        if (thumbnail) {
            const progressBarX = rect.left + x - this.player.el().getBoundingClientRect().left;
            this.thumbnailViewer.show(thumbnail.url, progressBarX);
        } else {
            this.thumbnailViewer.hide();
        }
    }

    dispose(): void {
        if (this.seekBar) {
            this.seekBar.removeEventListener('mouseenter', this.handleMouseEnter);
            this.seekBar.removeEventListener('mouseleave', this.handleMouseLeave);
            this.seekBar.removeEventListener('mousemove', this.handleMouseMove);
        }
        
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }
}