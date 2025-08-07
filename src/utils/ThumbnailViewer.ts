import { IThumbnailViewer } from '../types';
import Player from 'video.js/dist/types/player';

export class ThumbnailViewer implements IThumbnailViewer {
    private container: HTMLElement | null = null;
    private imageElement: HTMLImageElement | null = null;
    private player: Player;
    private isVisible: boolean = false;
    private currentUrl: string = '';

    constructor(player: Player, width: number = 160, height: number = 90) {
        this.player = player;
        this.createElements(width, height);
    }

    private createElements(width: number, height: number): void {
        this.container = document.createElement('div');
        this.container.className = 'vjs-thumbnail-holder';
        this.container.style.cssText = `
            position: absolute;
            display: none;
            pointer-events: none;
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
            border: 1px solid rgba(255,255,255,0.2);
            z-index: 1000;
            transform: translateX(-50%);
        `;

        this.imageElement = document.createElement('img');
        this.imageElement.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            object-fit: cover;
            display: block;
        `;

        this.container.appendChild(this.imageElement);
        
        const controlBar = this.player.controlBar.el();
        if (controlBar && controlBar.parentElement) {
            controlBar.parentElement.appendChild(this.container);
        }
    }

    show(url: string, progressBarX: number): void {
        if (!this.container || !this.imageElement) return;

        if (url !== this.currentUrl) {
            this.currentUrl = url;
            this.imageElement.src = url;
        }

        if (!this.isVisible) {
            this.container.style.display = 'block';
            this.isVisible = true;
        }

        const controlBar = this.player.controlBar.el();
        if (controlBar) {
            const rect = controlBar.getBoundingClientRect();
            const containerRect = this.container.getBoundingClientRect();
            
            requestAnimationFrame(() => {
                if (this.container) {
                    this.container.style.left = `${progressBarX}px`;
                    this.container.style.bottom = `${controlBar.offsetHeight + 10}px`;
                    
                    const leftEdge = progressBarX - containerRect.width / 2;
                    const rightEdge = progressBarX + containerRect.width / 2;
                    const playerWidth = this.player.el().offsetWidth;
                    
                    if (leftEdge < 0) {
                        this.container.style.transform = `translateX(${-leftEdge}px)`;
                    } else if (rightEdge > playerWidth) {
                        this.container.style.transform = `translateX(${playerWidth - rightEdge}px)`;
                    } else {
                        this.container.style.transform = 'translateX(-50%)';
                    }
                }
            });
        }
    }

    hide(): void {
        if (!this.container || !this.isVisible) return;
        
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    dispose(): void {
        if (this.container && this.container.parentElement) {
            this.container.parentElement.removeChild(this.container);
        }
        this.container = null;
        this.imageElement = null;
    }
}