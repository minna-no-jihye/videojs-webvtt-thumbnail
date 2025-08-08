# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

- `pnpm dev` - Start Vite development server with hot reload
- `pnpm build` - Build production bundle (runs TypeScript compiler then Vite build)
- `pnpm preview` - Preview production build locally
- `pnpm typecheck` - Check TypeScript types without emitting files

### Testing

- `pnpm test` - Run all tests with Vitest
- `pnpm test:ui` - Open Vitest UI for interactive testing
- `pnpm test:coverage` - Generate test coverage report
- Run single test file: `pnpm vitest src/VTTParser.test.ts`
- Run tests in watch mode: `pnpm vitest --watch`

## Architecture

### Core Plugin Structure

This is a Video.js plugin that displays thumbnail previews from WebVTT files when hovering over the progress bar.

**Main Components:**

- `src/index.ts` - Plugin entry point that extends Video.js Plugin class and orchestrates all components
- `src/VTTParser.ts` - Parses WebVTT files containing thumbnail timing information, supports multiple time formats (HH:
  MM:SS.mmm, MM:SS.mmm)
- `src/utils/ThumbnailManager.ts` - Manages thumbnail data loading and retrieval
- `src/utils/ThumbnailViewer.ts` - Handles thumbnail DOM element creation and positioning
- `src/utils/ProgressBarHandler.ts` - Manages mouse events and progress bar interactions

### Plugin Lifecycle

1. Plugin registers as 'webvttThumbnails' on Video.js
2. On initialization, fetches and parses VTT file specified in options
3. Attaches mouse event listeners to progress bar
4. Shows/hides thumbnails based on hover position
5. Properly disposes resources when plugin is destroyed

### WebVTT Parsing

The parser handles WebVTT files with the following structure:

```
WEBVTT

00:00.000 --> 00:02.000
thumbnails/thumb1.jpg

00:02.000 --> 00:04.000
thumbnails/thumb2.jpg
```

### Build Configuration

- **Build Tool**: Vite with TypeScript
- **Output Format**: ES modules only
- **Target Browsers**: Modern browsers (Chrome ≥42, Firefox ≥38, Safari ≥8)
- **Package Manager**: Uses pnpm (evident from pnpm-lock.yaml)

### Type System Notes

- Missing interface definitions: `IThumbnailManager` and `IThumbnailViewer` are referenced but not defined in types.ts
- Main types are in `src/types.ts`: `VTTCue`, `ThumbnailData`, `VTTThumbnailOptions`

### Testing Approach

- Test framework: Vitest with jsdom environment
- Test data: Sample WebVTT files in `test/` directory
- Focus areas: VTT parsing accuracy, time format handling, error cases