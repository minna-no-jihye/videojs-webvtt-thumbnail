import videojs from 'video.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import webvttContent from '../test/webvtt.vtt?raw';
import type { VTTCue } from './types';
import { VTTParser } from './VTTParser';

describe('VTTParser', () => {
  let parser: VTTParser;

  beforeEach(() => {
    parser = new VTTParser();
    vi.clearAllMocks();
  });

  describe('VTT 파일 파싱', () => {
    it('test/webvtt.vtt 파일을 정상적으로 파싱한다.', () => {
      const result: VTTCue[] = parser.parse(webvttContent);
      expect(result).toHaveLength(12);

    });
  });

  describe('다양한 시간 형식 처리', () => {
    it('시간 형식 (HH:MM:SS.mmm)을 처리한다', () => {
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

    it('시간 형식 (MM:SS.mmm)을 처리해야 함', () => {
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

    it('밀리초 단위를 정확히 처리한다', () => {
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

    it('엣지 케이스 시간을 정확히 처리한다', () => {
      const content = `WEBVTT

59:59.999 --> 60:00.000
edge.jpg`;

      const result = parser.parse(content);

      expect(result[0].startTime).toBeCloseTo(3599.999, 3);
      expect(result[0].endTime).toBe(3600);
    });
  });

  describe('빈 줄과 공백 처리', () => {
    it('빈 큐를 건너뛰고 여러 빈 줄을 처리한다', () => {
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

      // 빈 큐가 생략되었는지 확인
      expect(result.some(cue => cue.text === '')).toBe(false);
    });

    it('추가 공백이 있는 콘텐츠를 처리한다.', () => {
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

    it('Windows 줄바꿈을 처리한다', () => {
      const content = `WEBVTT\r\n\r\n00:00.000 --> 00:10.000\r\n1.jpg\r\n\r\n00:10.000 --> 00:20.000\r\n2.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('1.jpg');
      expect(result[1].text).toBe('2.jpg');
    });
  });

  describe('WebVTT 헤더 처리', () => {
    it('잘못된 WebVTT 헤더에 대해 경고를 출력하고 빈 배열을 반환한다', () => {
      const warnSpy = vi.spyOn(videojs.log, 'warn');
      const content = `INVALID

00:00.000 --> 00:10.000
1.jpg`;

      const result = parser.parse(content);

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith('Invalid WebVTT format: file should start with WEBVTT');
    });

    it('빈 콘텐츠에 대해 경고를 출력하고 빈 배열을 반환한다', () => {
      const warnSpy = vi.spyOn(videojs.log, 'warn');

      const result = parser.parse('');

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalledWith('Invalid WebVTT format: file should start with WEBVTT');
    });

    it('메타데이터 헤더가 있는 WebVTT를 처리해야 함', () => {
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

    it('큐가 없는 WebVTT에 대해 빈 배열을 반환해야 함', () => {
      const content = `WEBVTT`;

      const result = parser.parse(content);

      expect(result).toEqual([]);
    });
  });

  describe('잘못된 형식 처리', () => {
    it('잘못된 타임스탬프라인은 무시된다', () => {
      const content = `WEBVTT

00:00.000 --> 
1.jpg

 --> 00:20.000
2.jpg

00:30.000 --> 00:40.000
3.jpg`;

      const result = parser.parse(content);

      // 유효한 큐만 파싱되어야 함 (불완전한 타임스탬프는 무시됨)
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('3.jpg');
      expect(result[0].startTime).toBe(30);  // 00:30.000 = 30초
      expect(result[0].endTime).toBe(40);     // 00:40.000 = 40초
    });

    it('타임스탬프 다음에 텍스트가 없는 경우를 처리해야 함', () => {
      const content = `WEBVTT

00:00.000 --> 00:10.000

00:10.000 --> 00:20.000
valid.jpg`;

      const result = parser.parse(content);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('valid.jpg');
    });

    it('연속된 타임스탬프를 처리해야 함', () => {
      const content = `WEBVTT

00:00.000 --> 00:10.000
00:10.000 --> 00:20.000
text.jpg`;

      const result = parser.parse(content);

      // 첫 번째 타임스탬프는 텍스트가 다른 타임스탬프이므로 건너뛰고
      // 두 번째 타임스탬프와 텍스트만 파싱됨
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        startTime: 10,  // 00:10.000 = 10초
        endTime: 20,     // 00:20.000 = 20초
        text: 'text.jpg',
      });
    });
  });

  describe('다양한 경로 형식', () => {
    it('URL 경로를 처리해야 함', () => {
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

    it('공백이 포함된 파일명을 처리해야 함', () => {
      const content = `WEBVTT

00:00.000 --> 00:10.000
file name with spaces.jpg

00:10.000 --> 00:20.000
another file.png`;

      const result = parser.parse(content);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('file name with spaces.jpg');
      expect(result[1].text).toBe('another file.png');
    });
  });
});