import argparse
import json
import sys
import os
import wave
import numpy as np

# Add current directory to path so imports work
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from generators import SpectralGenerator, SilentSubliminalGenerator
from binaural import BinauralBeatGenerator, IsochronicToneGenerator
from noise import PinkNoiseGenerator, BrownNoiseGenerator, WhiteNoiseGenerator
from solfeggio import SolfeggioGenerator

def save_wav(filename, rate, data, stereo=False):
    """Save audio data to WAV file. Supports mono and stereo."""
    if stereo and len(data.shape) == 2:
        # Stereo: data shape is (samples, 2)
        channels = 2
        # Interleave left and right channels
        scaled = np.int16(data * 32767)
        frames = scaled.flatten('C')  # Row-major: L0, R0, L1, R1, ...
    else:
        # Mono
        channels = 1
        scaled = np.int16(data * 32767)
        frames = scaled
    
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2)  # 2 bytes = 16 bit
        wav_file.setframerate(rate)
        wav_file.writeframes(frames.tobytes())
        
    print(f"[Output] File saved: {filename} ({'stereo' if channels == 2 else 'mono'})")

def main():
    parser = argparse.ArgumentParser(description="Subliminal Audio Engine")
    parser.add_argument("command", choices=[
        "spectral", "silent", 
        "binaural", "isochronic",
        "pink_noise", "brown_noise", "white_noise",
        "solfeggio"
    ], help="Type of generation")
    parser.add_argument("--text", help="Text intention (for spectral/silent)")
    parser.add_argument("--out", required=True, help="Output filename")
    parser.add_argument("--duration", type=int, default=60, help="Duration in seconds")
    parser.add_argument("--preset", help="Preset name (for binaural/isochronic)")
    parser.add_argument("--frequency", help="Frequency key or value (for solfeggio)")
    
    args = parser.parse_args()
    
    try:
        if args.command == "spectral":
            if not args.text:
                raise ValueError("--text is required for spectral")
            gen = SpectralGenerator()
            audio = gen.generate(args.text, duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio)
            
        elif args.command == "silent":
            if not args.text:
                raise ValueError("--text is required for silent")
            gen = SilentSubliminalGenerator()
            audio = gen.generate(args.text, duration_sec=args.duration, sample_rate=96000)
            save_wav(args.out, 96000, audio)
            
        elif args.command == "binaural":
            gen = BinauralBeatGenerator()
            preset = args.preset or 'alpha_relaxation'
            audio = gen.generate(preset=preset, duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio, stereo=True)
            
        elif args.command == "isochronic":
            gen = IsochronicToneGenerator()
            preset = args.preset or 'alpha_flow'
            audio = gen.generate(preset=preset, duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio)
            
        elif args.command == "pink_noise":
            gen = PinkNoiseGenerator()
            audio = gen.generate(duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio)
            
        elif args.command == "brown_noise":
            gen = BrownNoiseGenerator()
            audio = gen.generate(duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio)
            
        elif args.command == "white_noise":
            gen = WhiteNoiseGenerator()
            audio = gen.generate(duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio)
            
        elif args.command == "solfeggio":
            gen = SolfeggioGenerator()
            freq_key = args.frequency or '528'
            audio = gen.generate(frequency_key=freq_key, duration_sec=args.duration, sample_rate=44100)
            save_wav(args.out, 44100, audio)
            
    except Exception as e:
        print(f"[Error] Generation failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
