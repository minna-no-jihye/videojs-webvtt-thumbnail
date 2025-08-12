import { VTTCue } from '@/types';
import videojs from 'video.js';

export class VTTParser {
  parse(content: string): VTTCue[] {
    const lines = content.trim().split('\n');

    if (!this.isValidWebVTT(lines)) {
      videojs.log.warn('Invalid WebVTT format: file should start with WEBVTT');
      return [];
    }

    return this.extractCues(lines);
  }

  private isValidWebVTT(lines: string[]): boolean {
    return lines[0]?.includes('WEBVTT');
  }

  private extractCues(lines: string[]): VTTCue[] {
    const cues: VTTCue[] = [];
    const trimmedLines = lines.map(line => line.trim());

    const SKIP_WEBVTT_HEADER = 1;
    let currentLineIndex = SKIP_WEBVTT_HEADER;

    while (currentLineIndex < trimmedLines.length) {
      const currentLine = trimmedLines[currentLineIndex];

      if (!currentLine) {
        currentLineIndex++;
        continue;
      }
      const isTimestamp = this.isTimestampLine(currentLine);
      if (isTimestamp) {
        const timestamps = this.parseTimestamps(currentLine);
        const nextLineIndex = currentLineIndex + 1;
        const nextLine = trimmedLines[nextLineIndex];
        const nextLineIsText = nextLine && !this.isTimestampLine(nextLine);

        if (timestamps && nextLineIsText) {
          cues.push({
            startTime: timestamps.start,
            endTime: timestamps.end,
            text: nextLine,
          });

          const LINES_PROCESSED = 2; // 타임스탬프 라인 + 텍스트 라인
          currentLineIndex += LINES_PROCESSED;
          continue;
        }
      }

      currentLineIndex++;
    }

    return cues;
  }


  private isTimestampLine(line: string): boolean {
    return line.includes('-->');
  }

  private parseTimestamps(line: string): { start: number; end: number } | null {
    const parts = line.split('-->');
    if (parts.length !== 2) return null;

    const [startStr, endStr] = parts.map(s => s.trim());

    // 빈 문자열 체크
    if (!startStr || !endStr) return null;

    try {
      const startTime = this.parseTime(startStr);
      const endTime = this.parseTime(endStr);

      // NaN 체크
      if (isNaN(startTime) || isNaN(endTime)) return null;

      return {
        start: startTime,
        end: endTime,
      };
    } catch {
      return null;
    }
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