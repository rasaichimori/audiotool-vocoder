import {
  NexusLocation,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document";

export const createEnvelopeFollower = (
  t: SafeTransactionBuilder,
  frequencyHz: number,
  input: NexusLocation,
  output: NexusLocation,
  baseX: number = 0, // Base X position for envelope follower components
  baseY: number = 0 // Base Y position for envelope follower components
) => {
  const modSlope = t.create("stompboxSlope", {
    frequencyHz,
    resonanceFactor: 0.78,
    filterMode: 4,
  });
  const splitter = t.create("audioSplitter", {});
  const waveshaper = t.create("waveshaper", {});
  t.create("waveshaperAnchor", {
    waveshaper: waveshaper.location,
    u: 1,
    v: 1,
    b: 0.5,
  });
  t.create("waveshaperAnchor", {
    waveshaper: waveshaper.location,
    u: 0,
    v: 1,
    b: 0.5,
  });
  const ringModulator = t.create("ringModulator", { boostGain: 7.9433 });
  const envelopeSlope = t.create("stompboxSlope", {
    frequencyHz: 18,
    resonanceFactor: 0.78,
    filterMode: 1,
  });

  // Create desktop placements for all devices using proper spacing based on device sizes
  // Envelope follower chain: vocal input → splitter → direct/waveshaper paths → ring mod → lowpass
  // Device sizes: StompboxSlope=300x550, AudioSplitter=127x131, RingMod=76x77

  t.create("desktopPlacement", {
    entity: modSlope.location,
    x: baseX + 0, // Vocal input slope (300px wide)
    y: baseY,
  });

  t.create("desktopPlacement", {
    entity: splitter.location,
    x: baseX + 350, // After vocal slope: 300 + 50 spacing = 350
    y: baseY,
  });

  t.create("desktopPlacement", {
    entity: waveshaper.location,
    x: baseX + 350, // Same X as splitter (waveshaper path)
    y: baseY + 150, // Below splitter for waveshaper path
  });

  t.create("desktopPlacement", {
    entity: ringModulator.location,
    x: baseX + 530, // After splitter: 350 + 127 + 53 spacing = 530
    y: baseY,
  });

  t.create("desktopPlacement", {
    entity: envelopeSlope.location,
    x: baseX + 660, // After ring mod: 530 + 76 + 54 spacing = 660
    y: baseY,
  });

  // Create audio connections
  // Connect first stompbox-slope to splitter
  t.create("audioConnection", {
    fromSocket: modSlope.fields.audioOutput.location,
    toSocket: splitter.fields.audioInput.location,
  });

  // Connect splitter output A directly to ring modulator input 1
  t.create("audioConnection", {
    fromSocket: splitter.fields.audioOutputA.location,
    toSocket: ringModulator.fields.audioInput1.location,
  });

  // Connect splitter output B to waveshaper input
  t.create("audioConnection", {
    fromSocket: splitter.fields.audioOutputB.location,
    toSocket: waveshaper.fields.audioInput.location,
  });

  // Connect waveshaper output to ring modulator input 2
  t.create("audioConnection", {
    fromSocket: waveshaper.fields.audioOutput.location,
    toSocket: ringModulator.fields.audioInput2.location,
  });

  // Connect ring modulator output to second stompbox-slope input
  t.create("audioConnection", {
    fromSocket: ringModulator.fields.audioOutput.location,
    toSocket: envelopeSlope.fields.audioInput.location,
  });

  // create input and output connections
  t.create("audioConnection", {
    fromSocket: input,
    toSocket: modSlope.fields.audioInput.location,
  });

  t.create("audioConnection", {
    fromSocket: envelopeSlope.fields.audioOutput.location,
    toSocket: output,
  });
};

export const createBand = (
  t: SafeTransactionBuilder,
  frequencyHz: number,
  vocalInput: NexusLocation,
  carrierInput: NexusLocation,
  output: NexusLocation,
  baseX: number = 950, // Default X position for band components
  baseY: number = 50 // Default Y position for this band row
) => {
  const ringModulator = t.create("ringModulator", { boostGain: 7.9433 });
  createEnvelopeFollower(
    t,
    frequencyHz,
    vocalInput,
    ringModulator.fields.audioInput1.location,
    baseX, // Pass base X position
    baseY // Pass base Y position
  );

  const carrierSlope = t.create("stompboxSlope", {
    frequencyHz,
    resonanceFactor: 0.78,
    filterMode: 4,
  });

  // Create desktop placements for the additional devices
  // Position them in the band row layout accounting for envelope follower width
  t.create("desktopPlacement", {
    entity: ringModulator.location,
    x: baseX + 1000, // After envelope follower chain (baseX + 660 + 300 + 40 spacing)
    y: baseY + 200, // Offset within the row
  });

  t.create("desktopPlacement", {
    entity: carrierSlope.location,
    x: baseX + 1130, // After final ring mod (1000 + 76 + 54 spacing)
    y: baseY + 200, // Same row as ring modulator
  });

  t.create("audioConnection", {
    fromSocket: carrierInput,
    toSocket: carrierSlope.fields.audioInput.location,
  });
  t.create("audioConnection", {
    fromSocket: carrierSlope.fields.audioOutput.location,
    toSocket: ringModulator.fields.audioInput2.location,
  });

  t.create("audioConnection", {
    fromSocket: ringModulator.fields.audioOutput.location,
    toSocket: output,
  });
};
