import {VTTThumbnailOptions} from "@/types";
import videojs from 'video.js';
import Player from 'video.js/dist/types/player'
import Plugin from 'video.js/dist/types/plugin'
import {ProgressBarHandler} from './utils/ProgressBarHandler';
import {ThumbnailManager} from './utils/ThumbnailManager';
import {ThumbnailViewer} from './utils/ThumbnailViewer';

const VideojsPlugin = videojs.getPlugin('plugin') as typeof Plugin

class WebVttThumbnails extends VideojsPlugin {
    private options: VTTThumbnailOptions;
    private thumbnailManager: ThumbnailManager | null = null;
    private thumbnailViewer: ThumbnailViewer | null = null;
    private progressBarHandler: ProgressBarHandler | null = null;

    constructor(player: Player, options: VTTThumbnailOptions) {
        super(player);
        this.options = options;

        player.ready(() => {
            this.initialize();
        });
    }

    dispose(): void {
        if (this.progressBarHandler) {
            this.progressBarHandler.dispose();
            this.progressBarHandler = null;
        }

        if (this.thumbnailViewer) {
            this.thumbnailViewer.dispose();
            this.thumbnailViewer = null;
        }

        if (this.thumbnailManager) {
            this.thumbnailManager.dispose();
            this.thumbnailManager = null;
        }

        super.dispose();
    }

    private async initialize(): Promise<void> {
        if (!this.options.src) {
            console.warn('WebVTT thumbnails source not provided');
            return;
        }

        try {
            this.thumbnailManager = new ThumbnailManager(this.options.basePath);
            await this.thumbnailManager.loadVTT(this.options.src);

            this.thumbnailViewer = new ThumbnailViewer(
                this.player as Player,
                this.options.width,
                this.options.height
            );

            this.progressBarHandler = new ProgressBarHandler(
                this.player as Player,
                this.thumbnailManager,
                this.thumbnailViewer
            );

            this.progressBarHandler.initialize();

            console.log('WebVTT thumbnails plugin initialized');
        } catch (error) {
            console.error('Failed to initialize WebVTT thumbnails plugin:', error);
        }
    }
}

videojs.registerPlugin('webvttThumbnails', WebVttThumbnails);

export default WebVttThumbnails;
