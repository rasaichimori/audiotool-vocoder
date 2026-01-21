import {
  NexusEntity,
  NexusLocation,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document";
import { createEnvelopeFollower } from "./sceneCreation";

/**
 * Calculate the number of splitters needed for each level to achieve the target band count
 * For n bands, we need ceil(log3(n)) levels
 */
export function calculateSplitterLevels(bandCount: number): {
  levels: number[];
  totalSplitters: number;
} {
  const levels: number[] = [];
  let remaining = bandCount;
  let currentLevel = 1;

  while (remaining > 3) {
    const splittersThisLevel = Math.ceil(remaining / 3);
    levels.push(splittersThisLevel);
    remaining = splittersThisLevel;
    currentLevel++;
  }

  // Add the final level (always 1 splitter at the root)
  levels.push(1);
  levels.reverse(); // Start from root level

  const totalSplitters = levels.reduce((sum, count) => sum + count, 0);
  return { levels, totalSplitters };
}

/**
 * Generate exponential frequency distribution with space-around (like CSS)
 * Frequencies are distributed with equal spacing around each, not touching min/max boundaries
 */
export function generateFrequencies(
  bandCount: number,
  minFreq = 20,
  maxFreq = 10000
): number[] {
  const frequencies: number[] = [];
  const logMin = Math.log(minFreq);
  const logMax = Math.log(maxFreq);
  const totalRange = logMax - logMin;

  // Create equal spacing with gaps at start and end (like CSS space-around)
  const spacing = totalRange / bandCount; // Total space divided by number of bands
  const halfSpacing = spacing / 2; // Half space at start and end

  for (let i = 0; i < bandCount; i++) {
    // Start with half-space, then full spaces between frequencies
    const logFreq = logMin + halfSpacing + i * spacing;
    const freq = Math.exp(logFreq);
    frequencies.push(Math.round(freq));
  }
  return frequencies;
}

const centroidHeight = 500;
const splitterSize = 180;
const numberOfRows = 9;

/**
 * Create input splitter tree that splits one input into the specified number of outputs
 * Returns both the tree and the final outputs
 */
export function createInputSplitterTree(
  t: SafeTransactionBuilder,
  bandCount: number,
  baseX: number,
  baseY: number,
  treeId: string
): { splitters: NexusEntity<"audioSplitter">[]; outputs: NexusLocation[] } {
  const { levels } = calculateSplitterLevels(bandCount);
  const allSplitters: NexusEntity<"audioSplitter">[] = [];
  const outputs: NexusLocation[] = [];

  // Create splitters level by level
  let currentSplitters: NexusEntity<"audioSplitter">[] = [];

  for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
    const splittersInLevel = levels[levelIndex];
    const newSplitters: NexusEntity<"audioSplitter">[] = [];

    for (let i = 0; i < splittersInLevel; i++) {
      // Position splitter in tree formation
      const splitter = t.create("audioSplitter", {
        displayName: `${treeId} ${levelIndex + 1}-${i + 1}`,
        positionX: baseX + levelIndex * splitterSize,
        positionY: baseY + i * splitterSize, // Center around baseY,
      });
      allSplitters.push(splitter);
      newSplitters.push(splitter);

      // Connect from previous level (except first level)
      if (levelIndex > 0) {
        const parentIndex = Math.floor(i / 3);
        const outputIndex = i % 3;
        const outputField =
          outputIndex === 0
            ? "audioOutputA"
            : outputIndex === 1
            ? "audioOutputB"
            : "audioOutputC";

        if (currentSplitters[parentIndex]) {
          t.create("desktopAudioCable", {
            fromSocket:
              currentSplitters[parentIndex].fields[outputField].location,
            toSocket: splitter.fields.audioInput.location,
          });
        }
      }
    }

    currentSplitters = newSplitters;
  }

  // Collect outputs from the final level
  const finalLevelSplitters = currentSplitters;
  for (const splitter of finalLevelSplitters) {
    outputs.push(splitter.fields.audioOutputA.location);
    outputs.push(splitter.fields.audioOutputB.location);
    outputs.push(splitter.fields.audioOutputC.location);
  }

  return {
    splitters: allSplitters,
    outputs: outputs.slice(0, bandCount),
  };
}

/**
 * Create centroid with the specified number of channels
 */
export function createCentroidWithChannels(
  t: SafeTransactionBuilder,
  bandCount: number,
  x: number,
  y: number
): {
  centroid: NexusEntity<"centroid">;
  channels: NexusEntity<"centroidChannel">[];
} {
  const centroid = t.create("centroid", {
    positionX: x,
    positionY: y,
  });

  const channels: NexusEntity<"centroidChannel">[] = [];
  for (let i = 0; i < bandCount; i++) {
    const channel = t.create("centroidChannel", {
      centroid: centroid.location,
      orderAmongChannels: i,
      displayName: `Band ${i + 1}`,
    });
    channels.push(channel);
  }

  return { centroid, channels };
}

/**
 * Create the complete vocoder system with correct signal flow
 */
export function createVocoderSystem(
  t: SafeTransactionBuilder,
  bandCount: number
): void {
  const baseX = 0;
  const baseY = 0;

  // Create vocal splitter tree (top)
  const { splitters: vocalSplitters, outputs: vocalOutputs } =
    createInputSplitterTree(
      t,
      bandCount,
      baseX, // X position for vocal tree
      baseY + centroidHeight, // Y position for vocal tree (centered)
      "vocal"
    );

  // Create carrier splitter tree (bottom)
  const { splitters: carrierSplitters, outputs: carrierOutputs } =
    createInputSplitterTree(
      t,
      bandCount,
      baseX, // X position for carrier tree
      baseY + (bandCount / 3) * splitterSize + centroidHeight, // Y position for carrier tree (below vocal)
      "carrier"
    );

  // Create AudioDevice for vocal input and connect to first vocal splitter
  const audioDevice = t.create("audioDevice", {
    displayName: "Vocal Input",
    positionX: baseX - 200,
    positionY: baseY + centroidHeight,
  });

  t.create("desktopAudioCable", {
    fromSocket: audioDevice.fields.audioOutput.location,
    toSocket: vocalSplitters[0].fields.audioInput.location,
  });

  // Create Heisenberg for carrier input and connect to first carrier splitter
  const heisenberg = t.create("heisenberg", {
    displayName: "Carrier Synth",
    positionX: baseX - 800,
    positionY: baseY + (bandCount / 3) * splitterSize + centroidHeight,
    operatorA: {
      gain: 1,
      waveformIndex: 7,
      modulationFactorB: 0.24,
    },
    operatorC: {
      waveformIndex: 5,
      gain: 1,
      detuneFactor: 0.5, // -12 semitones
    },
    operatorD: {
      waveformIndex: 6,
      gain: 0.75,
      detuneFactor: 2, // +12 semitones
    },
    envelopeMain: {
      sustainFactor: 1,
    },
    filter: {
      cutoffFrequencyHz: 22050,
    },
  });

  t.create("desktopAudioCable", {
    fromSocket: heisenberg.fields.audioOutput.location,
    toSocket: carrierSplitters[0].fields.audioInput.location,
  });

  // Create centroid for final mixing (far right)
  const { centroid, channels } = createCentroidWithChannels(
    t,
    bandCount,
    baseX + splitterSize * Math.floor(Math.cbrt(bandCount)), // Much farther right after all processing
    baseY
  );

  // Generate frequencies
  const frequencies = generateFrequencies(bandCount);

  // Create bands in rows
  for (let i = 0; i < bandCount; i++) {
    // Calculate positions for this row
    const rowStart =
      baseX +
      splitterSize * Math.floor(Math.cbrt(bandCount)) +
      Math.floor(i / numberOfRows) * 710;
    const rowY = baseY + centroidHeight + (i % numberOfRows) * 600; // Start above center, space rows

    // Create carrier slope for this band
    const carrierSlope = t.create("stompboxSlope", {
      displayName: `Carrier Slope ${frequencies[i]} Hz`,
      positionX: rowStart, // After carrier tree
      positionY: rowY + 300,
      frequencyHz: frequencies[i],
      resonanceFactor: 0.78,
      filterModeIndex: 4,
    });

    // Connect carrier output to carrier slope
    t.create("desktopAudioCable", {
      fromSocket: carrierOutputs[i],
      toSocket: carrierSlope.fields.audioInput.location,
    });

    // Create final ring modulator for this band
    const finalRingMod = t.create("ringModulator", {
      positionX: rowStart + 550,
      positionY: rowY + 350,
      gain: 7.943282,
    });

    // Create envelope follower and connect it between vocal slope and final ring mod
    createEnvelopeFollower(
      t,
      frequencies[i],
      vocalOutputs[i],
      finalRingMod.fields.audioInput1.location, // Vocal side of final ring mod
      rowStart, // X position for envelope follower components
      rowY // Y position for this row
    );

    // Connect carrier slope to final ring modulator (carrier side)
    t.create("desktopAudioCable", {
      fromSocket: carrierSlope.fields.audioOutput.location,
      toSocket: finalRingMod.fields.audioInput2.location,
    });

    // Connect final ring modulator to centroid channel
    t.create("desktopAudioCable", {
      fromSocket: finalRingMod.fields.audioOutput.location,
      toSocket: channels[i].fields.audioInput.location,
    });
  }

  const curveX =
    splitterSize * Math.floor(Math.cbrt(bandCount)) +
    (bandCount / numberOfRows) * 710;

  // Create Curve device with high shelf at 863Hz and 26dB
  const curve = t.create("curve", {
    displayName: "Vocoder Output EQ",
    positionX: curveX,
    positionY: baseY,
    highShelf: {
      centerFrequencyHz: 863,
      gainDb: 26,
      isEnabled: true,
    },
  });

  // Create Gravity (compressor)
  const gravity = t.create("gravity", {
    displayName: "Vocoder Compressor",
    positionX: curveX + 550,
    positionY: baseY,
  });

  // Create Mixer Channel
  const mixerChannel = t.create("mixerChannel", {});

  // Connect Centroid output to Curve input
  t.create("desktopAudioCable", {
    fromSocket: centroid.fields.audioOutput.location,
    toSocket: curve.fields.audioInput.location,
  });

  // Connect Curve output to Gravity input
  t.create("desktopAudioCable", {
    fromSocket: curve.fields.audioOutput.location,
    toSocket: gravity.fields.audioInput.location,
  });

  // Connect Gravity output to Mixer Channel input
  t.create("desktopAudioCable", {
    fromSocket: gravity.fields.audioOutput.location,
    toSocket: mixerChannel.fields.audioInput.location,
  });
}
