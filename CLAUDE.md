# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Build and Development
- `pnpm dev` - Start development server with Vite
- `pnpm build` - Build the library (runs TypeScript compiler then Vite build)
- `pnpm preview` - Preview the built library

### Testing
- `pnpm test` - Run tests with Vitest
- `pnpm test:ui` - Run tests with Vitest UI interface
- `pnpm test:coverage` - Run tests with coverage report
- Run a single test file: `pnpm test src/VTTParser.test.ts`

### Type Checking
- `pnpm typecheck` - Run TypeScript type checking without emitting files

## Architecture

This is a Video.js plugin for displaying WebVTT thumbnail previews on video progress bars.

### Core Components

1. **VTTParser** (src/VTTParser.ts:4-99)
   - Parses WebVTT files containing thumbnail timing information
   - Validates WebVTT format and extracts cue data
   - Converts timestamp strings to seconds

2. **VTTThumbnailsPlugin** (src/plugin.ts:11-201)
   - Main Video.js plugin class extending VideoJSPlugin
   - Manages thumbnail loading, UI creation, and mouse event handling
   - Creates and positions thumbnail preview element on hover
   - Supports both sprite sheets (with coordinates) and individual images

### Key Design Patterns

- **Plugin Registration**: Uses Video.js plugin system via `videojs.registerPlugin('vttThumbnails', VTTThumbnailsPlugin)`
- **Async Loading**: Thumbnails are loaded asynchronously from VTT files via fetch API
- **Event-Driven UI**: Mouse events on progress bar trigger thumbnail display/positioning
- **TypeScript Strict Mode**: All code uses strict TypeScript with comprehensive type definitions

### Module Structure

- **Entry Point**: src/index.ts exports the plugin and parser
- **Type Definitions**: src/types.ts defines all interfaces (VTTCue, ThumbnailCue, options)
- **Path Aliasing**: Uses `@/` alias for src directory imports
- **Build Output**: ES module format library built to dist/videojs-webvtt-thumbnails.js

### Dependencies

- **Peer Dependency**: video.js ^8.0.0 (must be installed by consuming application)
- **Build Tools**: Vite, TypeScript, Vitest for development
- **Browser Support**: Legacy browser support via @vitejs/plugin-legacy (Chrome 42+, Firefox 38+, Safari 8+)