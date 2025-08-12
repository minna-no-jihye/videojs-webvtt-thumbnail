import viteLegacyPlugin from "@vitejs/plugin-legacy";
import {resolve} from 'path';
import {defineConfig} from 'vite';

export default defineConfig({
    plugins: [
        viteLegacyPlugin({
            targets: [
                'Chrome >= 42',
                'Firefox >= 38',
                'Safari >= 8',
                'Edge >= 12',
                'Opera >= 29'
            ],
            //ES 문법 관련 폴리필만 포함
            modernPolyfills: true
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            fileName: 'videojs-webvtt-thumbnails',
            formats: ['es']
        },
        rollupOptions: {
            external: ['video.js']
        },
        minify: 'terser',
        sourcemap: true
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    }
});