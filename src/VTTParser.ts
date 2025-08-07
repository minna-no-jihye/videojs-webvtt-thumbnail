import { VTTCue } from '@/types';

export class VTTParser {
  parse(content: string): VTTCue[] {
    const lines = content.trim().split('\n');

    this.validateWebVTT(lines);

    return this.extractCues(lines);
  }

  private validateWebVTT(lines: string[]): void {
    if (!lines[0]?.includes('WEBVTT')) {
      throw new Error('Invalid WebVTT file: must start with WEBVTT');
    }
  }

  private extractCues(lines: string[]): VTTCue[] {
    return lines
      .slice(1)
      .map((line, index) => ({ line: line.trim(), originalIndex: index + 1 }))
      .filter(({ line }) => this.isTimestampLine(line))
      .map(({ line, originalIndex }) => this.parseCueFromLines(line, lines, originalIndex))
      .filter((cue): cue is VTTCue => cue !== null);
  }

  private isTimestampLine(line: string): boolean {
    return line.includes('-->');
  }

  private parseCueFromLines(
    timestampLine: string,
    lines: string[],
    currentIndex: number,
  ): VTTCue | null {
    const timestamps = this.parseTimestamps(timestampLine);
    if (!timestamps) return null;

    const textLines = this.collectCueText(lines, currentIndex + 1);
    if (!textLines.length) return null;

    return {
      startTime: timestamps.start,
      endTime: timestamps.end,
      text: textLines.join('\n'),
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

  private collectCueText(lines: string[], startIndex: number): string[] {
    const textLines: string[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line || this.isTimestampLine(line)) break;

      textLines.push(line);
    }

    return textLines;
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