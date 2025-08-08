import { VTTCue } from '@/types';
import videojs from 'video.js';

export class VTTParser {
  parse(content: string): VTTCue[] {
    const lines = content.trim().split('\n');

    if (!this.isValidWebVTT(lines)) {
      videojs.log.warn('[VTTParser] Invalid WebVTT file: must start with WEBVTT');
      return [];
    }

    return this.extractCues(lines);
  }

  private isValidWebVTT(lines: string[]): boolean {
    return lines[0]?.includes('WEBVTT') ?? false;
  }

  private extractCues(lines: string[]): VTTCue[] {
    const cues: VTTCue[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();

      if (this.isTimestampLine(line)) {
        const cue = this.parseCue(line, lines, i);
        if (cue) cues.push(cue);
      }
    }

    return cues;
  }

  private isTimestampLine(line: string): boolean {
    return line.includes('-->');
  }

  private parseCue(
    timestampLine: string,
    lines: string[],
    lineIndex: number,
  ): VTTCue | null {
    const timestamps = this.parseTimestamps(timestampLine);
    if (!timestamps) return null;

    const text = this.collectCueText(lines, lineIndex + 1);
    if (!text) return null;

    return {
      startTime: timestamps.start,
      endTime: timestamps.end,
      text,
    };
  }

  private parseTimestamps(line: string): { start: number; end: number } | null {
    const parts = line.split('-->').map(s => s.trim());
    if (parts.length !== 2) return null;

    try {
      return {
        start: this.parseTime(parts[0]),
        end: this.parseTime(parts[1]),
      };
    } catch {
      return null;
    }
  }

  private collectCueText(lines: string[], startIndex: number): string {
    const textLines: string[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line || this.isTimestampLine(line)) break;

      textLines.push(line);
    }

    return textLines.join('\n');
  }

  private parseTime(timeStr: string): number {
    const parts = timeStr.split(':');
    const seconds = parts[parts.length - 1];
    const minutes = parts[parts.length - 2] || '0';
    const hours = parts[parts.length - 3] || '0';

    return (
      parseFloat(hours) * 3600 +
      parseFloat(minutes) * 60 +
      parseFloat(seconds)
    );
  }
}