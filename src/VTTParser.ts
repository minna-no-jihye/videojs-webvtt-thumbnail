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
    
    for (let i = 1; i < trimmedLines.length; i++) {
      const line = trimmedLines[i];
      
      if (!line || !this.isTimestampLine(line)) continue;
      
      const timestamps = this.parseTimestamps(line);
      if (!timestamps) continue;
      
      const { textLines, nextIndex } = this.collectCueText(trimmedLines, i + 1);
      
      if (textLines.length > 0) {
        cues.push({
          startTime: timestamps.start,
          endTime: timestamps.end,
          text: textLines.join('\n'),
        });
      }
      
      i = nextIndex - 1;
    }
    
    return cues;
  }

  private collectCueText(lines: string[], startIndex: number): { textLines: string[]; nextIndex: number } {
    const textLines: string[] = [];
    let endIndex = startIndex;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      if (!line || this.isTimestampLine(line)) {
        endIndex = i;
        break;
      }
      
      textLines.push(line);
      endIndex = i + 1;
    }
    
    return { textLines, nextIndex: endIndex };
  }

  private isTimestampLine(line: string): boolean {
    return line.includes('-->');
  }

  private parseTimestamps(line: string): { start: number; end: number } | null {
    const parts = line.split('-->');
    if (parts.length !== 2) return null;
    
    const [startStr, endStr] = parts.map(s => s.trim());
    
    try {
      return {
        start: this.parseTime(startStr),
        end: this.parseTime(endStr),
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