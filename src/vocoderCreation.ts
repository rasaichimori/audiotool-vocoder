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
      const splitter = t.create("audioSplitter", {});
      allSplitters.push(splitter);
      newSplitters.push(splitter);

      // Position splitter in tree formation
      const x = baseX + levelIndex * 200;
      const y = baseY + (i - (splittersInLevel - 1) / 2) * 150; // Center around baseY

      t.create("desktopPlacement", {
        entity: splitter.location,
        x,
        y,
      });

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
          t.create("audioConnection", {
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
  const centroid = t.create("centroid", {});
  t.create("desktopPlacement", {
    entity: centroid.location,
    x,
    y,
  });

  const channels: NexusEntity<"centroidChannel">[] = [];
  for (let i = 0; i < bandCount; i++) {
    const channel = t.create("centroidChannel", {
      centroid: centroid.location,
      index: i,
      name: `Band ${i + 1}`,
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
  // Create vocal splitter tree (top)
  const { splitters: vocalSplitters, outputs: vocalOutputs } =
    createInputSplitterTree(
      t,
      bandCount,
      250, // X position for vocal tree
      0, // Y position for vocal tree (centered)
      "vocal"
    );

  // Create carrier splitter tree (bottom)
  const { splitters: carrierSplitters, outputs: carrierOutputs } =
    createInputSplitterTree(
      t,
      bandCount,
      250, // X position for carrier tree
      -200, // Y position for carrier tree (below vocal)
      "carrier"
    );

  // Create centroid for final mixing (far right)
  const { centroid, channels } = createCentroidWithChannels(
    t,
    bandCount,
    3200, // Much farther right after all processing
    0 // Centered vertically
  );

  // Generate frequencies
  const frequencies = generateFrequencies(bandCount);

  // Create bands in rows
  for (let i = 0; i < bandCount; i++) {
    // Calculate positions for this row
    const rowY = -300 + i * 600; // Start above center, space rows

    // Create carrier slope for this band
    const carrierSlope = t.create("stompboxSlope", {
      frequencyHz: frequencies[i],
      resonanceFactor: 0.78,
      filterMode: 4,
    });

    t.create("desktopPlacement", {
      entity: carrierSlope.location,
      x: 800, // After carrier tree
      y: rowY,
    });

    // Connect carrier output to carrier slope
    t.create("audioConnection", {
      fromSocket: carrierOutputs[i],
      toSocket: carrierSlope.fields.audioInput.location,
    });

    // Create final ring modulator for this band
    const finalRingMod = t.create("ringModulator", { boostGain: 7.9433 });

    t.create("desktopPlacement", {
      entity: finalRingMod.location,
      x: 2300, // Near the end of the chain
      y: rowY,
    });

    // Create envelope follower and connect it between vocal slope and final ring mod
    createEnvelopeFollower(
      t,
      frequencies[i],
      vocalOutputs[i],
      finalRingMod.fields.audioInput1.location, // Vocal side of final ring mod
      1400, // X position for envelope follower components
      rowY // Y position for this row
    );

    // Connect carrier slope to final ring modulator (carrier side)
    t.create("audioConnection", {
      fromSocket: carrierSlope.fields.audioOutput.location,
      toSocket: finalRingMod.fields.audioInput2.location,
    });

    // Connect final ring modulator to centroid channel
    t.create("audioConnection", {
      fromSocket: finalRingMod.fields.audioOutput.location,
      toSocket: channels[i].fields.audioInput.location,
    });
  }
}
