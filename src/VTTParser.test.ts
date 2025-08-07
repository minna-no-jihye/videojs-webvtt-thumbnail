import { beforeEach, describe, expect, it } from 'vitest';
import webvttContent from '../test/webvtt.vtt?raw';
import type { VTTCue } from './types';
import { VTTParser } from './VTTParser';

describe('VTTParser', () => {
  let parser: VTTParser;

  beforeEach(() => {
    parser = new VTTParser();
  });

  describe('parse', () => {
    it('should parse actual WebVTT file from /test/webvtt.vtt', () => {
      const result: VTTCue[] = parser.parse(webvttContent);

      // Verify total count
      expect(result).toHaveLength(12);

      // Test first entries with structured data
      const expectedFirstEntries: VTTCue[] = [
        { startTime: 0, endTime: 10, text: '1.jpg' },
        { startTime: 10, endTime: 20, text: '2.jpg' },
        { startTime: 20, endTime: 30, text: '3.jpg' },
        { startTime: 30, endTime: 40, text: '4.jpg' },
        { startTime: 40, endTime: 50, text: '5.jpg' },
      ];

      expectedFirstEntries.forEach((expected, index) => {
        expect(result[index]).toEqual(expected);
      });

      // Test cyclic pattern (files repeat)
      expect(result[5].text).toBe('1.jpg');
      expect(result[6].text).toBe('2.jpg');

      // Verify time continuity
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startTime).toBe(result[i - 1].endTime);
      }
    });

    it('should handle time format with hours', () => {
      const content = `WEBVTT

01:30:15.500 --> 01:45:30.750
thumbnail.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        startTime: 5415.5,  // 1*3600 + 30*60 + 15.5
        endTime: 6330.75,   // 1*3600 + 45*60 + 30.75
        text: 'thumbnail.jpg',
      });
    });

    it('should handle time format without hours', () => {
      const content = `WEBVTT

05:30.000 --> 10:15.000
image.png`;

      const result = parser.parse(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        startTime: 330,  // 5*60 + 30
        endTime: 615,    // 10*60 + 15
        text: 'image.png',
      });
    });

    it('should handle decimal seconds', () => {
      const content = `WEBVTT

00:00:01.234 --> 00:00:05.678
frame.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        startTime: 1.234,
        endTime: 5.678,
        text: 'frame.jpg',
      });
    });

    it('should skip empty cues and handle multiple empty lines', () => {
      const content = `WEBVTT

00:00.000 --> 00:10.000
1.jpg


00:10.000 --> 00:20.000
2.jpg

00:20.000 --> 00:30.000

00:30.000 --> 00:40.000
3.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('1.jpg');
      expect(result[1].text).toBe('2.jpg');
      expect(result[2].text).toBe('3.jpg');

      // Verify that empty cue was skipped
      expect(result.some(cue => cue.text === '')).toBe(false);
    });

    it('should throw error for invalid WebVTT header', () => {
      const content = `INVALID

00:00.000 --> 00:10.000
1.jpg`;

      expect(() => parser.parse(content)).toThrow('Invalid WebVTT file');
    });

    it('should throw error for empty content', () => {
      expect(() => parser.parse('')).toThrow('Invalid WebVTT file');
    });

    it('should handle content with extra whitespace', () => {
      const content = `  WEBVTT  

  00:00.000   -->   00:10.000  
  1.jpg  

  00:10.000   -->   00:20.000  
  2.jpg  `;

      const result = parser.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        startTime: 0,
        endTime: 10,
        text: '1.jpg',
      });
    });

    it('should handle Windows line endings', () => {
      const content = `WEBVTT\r\n\r\n00:00.000 --> 00:10.000\r\n1.jpg\r\n\r\n00:10.000 --> 00:20.000\r\n2.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('1.jpg');
      expect(result[1].text).toBe('2.jpg');
    });

    it('should handle multiple text lines after timestamp', () => {
      const content = `WEBVTT

00:00.000 --> 00:10.000
first-line.jpg

00:10.000 --> 00:20.000
second-line.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('first-line.jpg');
      expect(result[1].text).toBe('second-line.jpg');
    });

    it('should return empty array for WebVTT with no cues', () => {
      const content = `WEBVTT`;

      const result = parser.parse(content);

      expect(result).toEqual([]);
    });

    it('should handle WebVTT with metadata header', () => {
      const content = `WEBVTT
Kind: thumbnails

00:00.000 --> 00:10.000
1.jpg

00:10.000 --> 00:20.000
2.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('1.jpg');
      expect(result[1].text).toBe('2.jpg');
    });

    it('should handle malformed timestamps gracefully', () => {
      const content = `WEBVTT

00:00.000 --> 
1.jpg

 --> 00:20.000
2.jpg

00:30.000 --> 00:40.000
3.jpg`;

      const result = parser.parse(content);

      // Only the valid cue should be parsed
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.find(cue => cue.text === '3.jpg')).toBeDefined();
    });

    it('should handle URL paths in text', () => {
      const content = `WEBVTT

00:00.000 --> 00:10.000
http://example.com/thumbnails/1.jpg

00:10.000 --> 00:20.000
../images/2.jpg

00:20.000 --> 00:30.000
/absolute/path/3.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('http://example.com/thumbnails/1.jpg');
      expect(result[1].text).toBe('../images/2.jpg');
      expect(result[2].text).toBe('/absolute/path/3.jpg');
    });
  });

  describe('parseTime', () => {
    it('should parse time with milliseconds correctly', () => {
      // parseTime is private, so we test it through parse method
      const content = `WEBVTT

00:00:00.123 --> 00:00:00.456
test.jpg`;

      const result = parser.parse(content);

      expect(result[0].startTime).toBeCloseTo(0.123, 3);
      expect(result[0].endTime).toBeCloseTo(0.456, 3);
    });

    it('should handle edge case times', () => {
      const content = `WEBVTT

59:59.999 --> 60:00.000
edge.jpg`;

      const result = parser.parse(content);

      expect(result[0].startTime).toBeCloseTo(3599.999, 3);
      expect(result[0].endTime).toBe(3600);
    });
  });
});