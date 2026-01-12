import numpy as np
from PIL import Image, ImageDraw, ImageFont
from safety import AudioSafeGuard

class SpectralGenerator:
    """
    Encodes text into the audio spectrum (Spectrogram Art).
    """
    def generate(self, text: str, duration_sec: int = 10, sample_rate: int = 44100) -> np.ndarray:
        print(f"[Spectral] Encoding: '{text}'")
        
        # 1. Configuration
        min_freq = 2000 
        max_freq = 10000 
        width = int(duration_sec * 50) # 50 px/sec resolution
        height = 64 # Frequency bands
        
        # 2. Draw Text Image
        img = Image.new('L', (width, height), color=0)
        draw = ImageDraw.Draw(img)
        
        # Try loading a system font, fallback to default
        try:
            # Try a few common windows fonts
            font = ImageFont.truetype("arial.ttf", 40)
        except:
            try:
                font = ImageFont.truetype("segoeui.ttf", 40)
            except:
                font = ImageFont.load_default()
        
        # Center text
        bbox = draw.textbbox((0, 0), text, font=font)
        text_w, text_h = bbox[2], bbox[3]
        
        # Create a separate image for text to handle resizing
        text_img = Image.new('L', (text_w + 20, height), color=0) # Add padding
        text_draw = ImageDraw.Draw(text_img)
        
        # Draw vertically centered
        ty = (height - text_h) // 2
        text_draw.text((10, ty), text, fill=255, font=font)
        
        # Resize if text is wider than the target audio duration width
        if text_w > width:
            print(f"[Spectral] Resizing text from {text_w}px to {width}px to fit duration.")
            text_img = text_img.resize((width, height), resample=Image.Resampling.LANCZOS)
            x = 0
            img.paste(text_img, (x, 0))
        else:
            # Center it normally
            x = (width - (text_w + 20)) // 2
            img.paste(text_img, (max(0, x), 0))
        
        # Flip for spectrogram (Low freq at bottom)
        img = img.transpose(Image.FLIP_TOP_BOTTOM)
        pixels = np.array(img) / 255.0

        # 3. Synthesis
        total_samples = int(sample_rate * duration_sec)
        audio_output = np.zeros(total_samples)
        samples_per_pixel = total_samples // width
        freqs = np.linspace(min_freq, max_freq, height)
        t_step = np.arange(samples_per_pixel) / sample_rate
        
        # Vectorized synthesis per column
        for x_idx in range(width):
            col = pixels[:, x_idx]
            active_indices = np.where(col > 0.1)[0]
            
            if len(active_indices) > 0:
                # Pre-sum sine waves for this time slice
                # This is the heavy part - optimized:
                intensities = col[active_indices]
                active_freqs = freqs[active_indices]
                
                # Outer Product: (freqs x time) -> wave matrix
                # sin(2 * pi * f * t)
                # freq_matrix shape: (num_active, len(t_step))
                phases = 2 * np.pi * np.outer(active_freqs, t_step)
                waves = np.sin(phases)
                
                # Apply intensity weights
                weighted_waves = waves * intensities[:, np.newaxis]
                
                # Sum all waves
                signal_slice = np.sum(weighted_waves, axis=0)
                
                # Add to main buffer
                start = x_idx * samples_per_pixel
                end = start + samples_per_pixel
                if end <= total_samples:
                    audio_output[start:end] = signal_slice

        # 4. Safety Pass
        audio_output = AudioSafeGuard.normalize(audio_output, target_db=-3.0)
        audio_output = AudioSafeGuard.apply_fade(audio_output, sample_rate)
        
        return audio_output


class SilentSubliminalGenerator:
    """
    Generates 'Silent' Ultrasonic Subliminals using AM Modulation (Low SSB).
    """
    def generate(self, text: str, duration_sec: int = 60, sample_rate: int = 96000) -> np.ndarray:
        print(f"[Silent] Processing: '{text}' (Ultrasonic AM)")
        
        # Safety: Needs high sample rate
        AudioSafeGuard.validate_frequency_range(0, 20000, sample_rate)
        
        t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
        
        # 1. Message Signal (Gematria Tone for now, ideally Voice)
        # Using a simple placeholder tone based on text length + Gematria
        seed_freq = sum([ord(c) for c in text]) 
        while seed_freq < 100: seed_freq *= 2
        while seed_freq > 400: seed_freq /= 2
        
        message_signal = np.sin(2 * np.pi * seed_freq * t)
        
        # 2. Carrier (Border of hearing)
        carrier_freq = 17500 # 17.5 kHz
        carrier = np.sin(2 * np.pi * carrier_freq * t)
        
        # 3. AM Modulation
        # Shifts the message freq UP to 17500 +/- message_freq
        modulation_index = 0.8
        ultrasonic_signal = carrier * (1 + modulation_index * message_signal)
        
        # 4. Safety
        ultrasonic_signal = AudioSafeGuard.normalize(ultrasonic_signal, target_db=-1.0)
        ultrasonic_signal = AudioSafeGuard.apply_fade(ultrasonic_signal, sample_rate)
        
        return ultrasonic_signal
