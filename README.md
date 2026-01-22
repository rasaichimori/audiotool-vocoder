# Audiotool Vocoder Generator

A web app that creates multi-band vocoder systems directly in your Audiotool projects using the Nexus SDK.

## What It Does

This tool generates a complete vocoder signal chain inside Audiotool with a configurable number of frequency bands (3–50). Each vocoder includes:

- **Dual splitter trees** — One for the vocal/modulator input, one for the carrier signal
- **Per-band processing** — Each band gets its own filter (Slope), envelope follower, and ring modulator
- **Exponential frequency distribution** — Bands are logarithmically spaced from 20Hz to 10kHz
- **Carrier synth** — A Heisenberg synthesizer pre-configured with a rich harmonic sound
- **Vocal input** — An AudioDevice with a sample region ready for your audio
- **Output chain** — Centroid mixer → Curve EQ (high shelf at 863Hz) → Gravity compressor → Mixer channel

## Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the dev server**:

   ```bash
   npm run dev
   ```

   Make sure that you are running it locally on http://127.0.0.1:5174 for it to work

3. **Log in** with you audiotool account

4. **Select a project** from your Audiotool account

5. **Configure the vocoder**:
   - Adjust the band count with the knob (3–50 bands)
   - Optionally set the X/Y position in the project
6. **Click "Create Vocoder"** — the system is generated in your project

7. **Open in Audiotool** to see and use the vocoder

## Project Structure

```
src/
├── App.tsx                 # App routing (login → project selection → vocoder)
├── pages/
│   ├── LoginPage.tsx       # PAT authentication
│   ├── ProjectSelectionPage.tsx  # Project picker
│   └── VocoderPage.tsx     # Main vocoder creation UI
├── components/
│   └── Knob.tsx            # Band count control
├── hooks/
│   ├── useLoginStatus.ts   # Auth state management
│   └── useProjects.ts      # Project fetching
├── vocoderCreation.ts      # Vocoder signal chain generation
└── sceneCreation.ts        # Helper entity creation functions
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for development/build
- **Audiotool Nexus SDK** for real-time project sync

## Notes

- The SDK only allows one synced document per browser tab — the app reloads when switching projects
- Higher band counts (35+) create complex systems; use with caution
- The generated vocoder uses a default sample; replace it with your own audio in Audiotool

## Links

- [Audiotool Platform](https://www.audiotool.com/)
- [Audiotool DEV Portal](https://developer.audiotool.com/)
