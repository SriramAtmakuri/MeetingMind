/**
 * Speaker diarization using pyannote.audio
 * For now, this returns mock data. To use real pyannote.audio:
 * 1. Set up Python environment with pyannote.audio
 * 2. Create a Python script that accepts audio file and returns speaker labels
 * 3. Call it from Node.js using child_process
 * 4. Uncomment the real implementation below
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function diarizeAudio(filePath, transcription) {
  console.log(`Performing speaker diarization: ${filePath}`);

  // OPTION 1: Use pyannote.audio via Python script (recommended for production)
  // Uncomment this section when pyannote.audio is set up
  /*
  try {
    const pythonScript = './python/diarize.py';
    const command = `python3 ${pythonScript} "${filePath}"`;

    const { stdout } = await execPromise(command);
    const diarizationData = JSON.parse(stdout);

    return processDiarization(transcription.segments, diarizationData);
  } catch (error) {
    console.error('Diarization failed:', error);
    // Fall back to mock data
  }
  */

  // MOCK DATA for development
  console.log('⚠️  Using MOCK diarization data. Set up pyannote.audio for real speaker detection.');

  // Simulate speaker diarization by distributing segments among speakers
  const speakers = [
    { label: 'SPEAKER_00', talkTime: 0 },
    { label: 'SPEAKER_01', talkTime: 0 },
    { label: 'SPEAKER_02', talkTime: 0 },
    { label: 'SPEAKER_03', talkTime: 0 },
  ];

  const segments = transcription.segments.map((segment, index) => {
    // Distribute speakers in a pattern
    const speakerIndex = index % speakers.length;
    const speakerLabel = speakers[speakerIndex].label;

    // Calculate talk time
    const duration = segment.end - segment.start;
    speakers[speakerIndex].talkTime += duration;

    return {
      ...segment,
      speaker: speakerLabel,
      confidence: 0.92 + (Math.random() * 0.06), // 0.92-0.98
    };
  });

  return {
    speakers,
    segments,
  };
}

/**
 * Process diarization results and match with transcription segments
 */
function processDiarization(transcriptSegments, diarizationData) {
  // Match speaker labels with transcript segments based on timestamps
  const segments = transcriptSegments.map(segment => {
    const speaker = findSpeakerAtTime(
      diarizationData.speakers,
      segment.start,
      segment.end
    );

    return {
      ...segment,
      speaker: speaker.label,
      confidence: segment.confidence || 0.95,
    };
  });

  // Calculate talk time for each speaker
  const speakers = calculateSpeakerStats(diarizationData.speakers, segments);

  return {
    speakers,
    segments,
  };
}

function findSpeakerAtTime(speakers, startTime, endTime) {
  // Find the speaker who was talking during this time range
  const midpoint = (startTime + endTime) / 2;

  for (const speaker of speakers) {
    for (const interval of speaker.intervals) {
      if (midpoint >= interval.start && midpoint <= interval.end) {
        return speaker;
      }
    }
  }

  // Default to first speaker if no match found
  return speakers[0] || { label: 'SPEAKER_00' };
}

function calculateSpeakerStats(speakers, segments) {
  const stats = new Map();

  // Initialize stats for each speaker
  speakers.forEach(speaker => {
    stats.set(speaker.label, {
      label: speaker.label,
      talkTime: 0,
      segments: 0,
    });
  });

  // Calculate talk time from segments
  segments.forEach(segment => {
    const stat = stats.get(segment.speaker);
    if (stat) {
      stat.talkTime += (segment.end - segment.start);
      stat.segments += 1;
    }
  });

  return Array.from(stats.values());
}
