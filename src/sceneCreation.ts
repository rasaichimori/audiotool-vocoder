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
    displayName: `Mod Slope ${frequencyHz} Hz`,
    positionX: baseX, // Vocal input slope (300px wide)
    positionY: baseY,
    frequencyHz,
    resonanceFactor: 0.78,
    filterModeIndex: 4,
  });
  const splitter = t.create("audioSplitter", {
    positionX: baseX + 200,
    positionY: baseY,
  });
  const waveshaper = t.create("waveshaper", {
    positionX: baseX + 200,
    positionY: baseY + 150,
  });
  t.create("waveshaperAnchor", {
    waveshaper: waveshaper.location,
    x: 1,
    y: 1,
    slope: 0.5,
  });
  t.create("waveshaperAnchor", {
    waveshaper: waveshaper.location,
    x: 0,
    y: 1,
    slope: 0.5,
  });
  const ringModulator = t.create("ringModulator", {
    gain: 7.943282,
    positionX: baseX + 380,
    positionY: baseY,
  });
  const envelopeSlope = t.create("stompboxSlope", {
    displayName: `Envelope Slope ${frequencyHz} Hz`,
    positionX: baseX + 510,
    positionY: baseY,
    frequencyHz: 18,
    resonanceFactor: 0.78,
    filterModeIndex: 1,
  });

  // Create audio connections
  // Connect first stompbox-slope to splitter
  t.create("desktopAudioCable", {
    fromSocket: modSlope.fields.audioOutput.location,
    toSocket: splitter.fields.audioInput.location,
  });

  // Connect splitter output A directly to ring modulator input 1
  t.create("desktopAudioCable", {
    fromSocket: splitter.fields.audioOutputA.location,
    toSocket: ringModulator.fields.audioInput1.location,
  });

  // Connect splitter output B to waveshaper input
  t.create("desktopAudioCable", {
    fromSocket: splitter.fields.audioOutputB.location,
    toSocket: waveshaper.fields.audioInput.location,
  });

  // Connect waveshaper output to ring modulator input 2
  t.create("desktopAudioCable", {
    fromSocket: waveshaper.fields.audioOutput.location,
    toSocket: ringModulator.fields.audioInput2.location,
  });

  // Connect ring modulator output to second stompbox-slope input
  t.create("desktopAudioCable", {
    fromSocket: ringModulator.fields.audioOutput.location,
    toSocket: envelopeSlope.fields.audioInput.location,
  });

  // create input and output connections
  t.create("desktopAudioCable", {
    fromSocket: input,
    toSocket: modSlope.fields.audioInput.location,
  });

  t.create("desktopAudioCable", {
    fromSocket: envelopeSlope.fields.audioOutput.location,
    toSocket: output,
  });
};
