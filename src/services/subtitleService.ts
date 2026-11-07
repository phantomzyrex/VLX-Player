import { SubtitleCue } from '../types';

/**
 * Parses SRT or WebVTT string into an array of SubtitleCue objects
 */
export function parseSubtitleText(content: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  // Normalize line endings
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  let i = 0;
  // Skip WEBVTT header if present
  if (lines[0] && lines[0].trim().startsWith('WEBVTT')) {
    i = 1;
    while (i < lines.length && lines[i].trim() !== '') {
      i++;
    }
  }

  const timeRegex = /(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(?:(\d{1,2}):)?(\d{2}):(\d{2})[,.](\d{3})/;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    // Check if line is a timestamp line or an index
    let timeMatch = line.match(timeRegex);
    let cueId = '';

    if (!timeMatch && i + 1 < lines.length) {
      // Possible index line, check next line for timestamp
      const nextLine = lines[i + 1].trim();
      timeMatch = nextLine.match(timeRegex);
      if (timeMatch) {
        cueId = line;
        i++;
      }
    }

    if (timeMatch) {
      const start = parseTimestamp(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
      const end = parseTimestamp(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);

      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        textLines.push(lines[i].trim());
        i++;
      }

      const text = textLines.join('\n').replace(/<[^>]+>/g, ''); // strip html tags
      if (text) {
        cues.push({
          id: cueId || `${start}-${end}`,
          start,
          end,
          text,
        });
      }
    } else {
      i++;
    }
  }

  return cues;
}

function parseTimestamp(hours: string | undefined, minutes: string, seconds: string, millis: string): number {
  const h = hours ? parseInt(hours, 10) : 0;
  const m = parseInt(minutes, 10);
  const s = parseInt(seconds, 10);
  const ms = parseInt(millis, 10);
  return h * 3600 + m * 60 + s + ms / 1000;
}

/**
 * Finds the currently active subtitle cue for a given video time with delay offset applied
 */
export function getActiveCue(cues: SubtitleCue[], currentTime: number, delaySeconds: number = 0): SubtitleCue | null {
  const adjustedTime = currentTime - delaySeconds;
  return cues.find((cue) => adjustedTime >= cue.start && adjustedTime <= cue.end) || null;
}
