import numpy as np
from safety import AudioSafeGuard

class SolfeggioGenerator:
    """
    Generates Solfeggio Frequencies - ancient healing tones.
    
    The Solfeggio frequencies are a set of specific tones believed to have 
    various healing and spiritual properties:
    
    174 Hz - Pain Relief, Security
    285 Hz - Healing Tissues, Energy Fields
    396 Hz - Liberating Guilt & Fear
    417 Hz - Facilitating Change
    432 Hz - Universal Frequency (Cosmic healing - not traditional solfeggio but popular)
    528 Hz - DNA Repair, Miracles, Love (The "Love Frequency")
    639 Hz - Connecting Relationships
    741 Hz - Awakening Intuition
    852 Hz - Returning to Spiritual Order
    963 Hz - Divine Consciousness, Pineal Activation
    """
    
    FREQUENCIES = {
        '174': {'freq': 174, 'name': 'Foundation', 'description': 'Pain Relief & Security'},
        '285': {'freq': 285, 'name': 'Healing', 'description': 'Tissue Healing & Energy'},
        '396': {'freq': 396, 'name': 'Liberation', 'description': 'Release Guilt & Fear'},
        '417': {'freq': 417, 'name': 'Change', 'description': 'Facilitate Change'},
        '432': {'freq': 432, 'name': 'Cosmic', 'description': 'Universal Healing'},
        '528': {'freq': 528, 'name': 'Love', 'description': 'DNA Repair & Miracles'},
        '639': {'freq': 639, 'name': 'Connection', 'description': 'Harmonizing Relationships'},
        '741': {'freq': 741, 'name': 'Intuition', 'description': 'Awakening Intuition'},
        '852': {'freq': 852, 'name': 'Spirit', 'description': 'Spiritual Order'},
        '963': {'freq': 963, 'name': 'Divine', 'description': 'Pineal Activation'},
    }
    
    def generate(self, frequency_key: str = '528', duration_sec: int = 60,
                 sample_rate: int = 44100, add_harmonics: bool = True) -> np.ndarray:
        """
        Generate a Solfeggio frequency tone.
        
        Args:
            frequency_key: Key from FREQUENCIES dict (e.g., '528')
            duration_sec: Duration in seconds
            sample_rate: Sample rate
            add_harmonics: If True, adds subtle harmonics for richer sound
            
        Returns:
            Mono numpy array
        """
        if frequency_key in self.FREQUENCIES:
            freq_data = self.FREQUENCIES[frequency_key]
            freq = freq_data['freq']
            name = freq_data['name']
        else:
            # Try to parse as direct frequency
            try:
                freq = float(frequency_key)
                name = f"Custom {freq}Hz"
            except:
                freq = 528
                name = "Love (default)"
        
        print(f"[Solfeggio] Generating: {freq}Hz ({name}), Duration={duration_sec}s")
        
        t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
        
        # Generate fundamental frequency
        audio = np.sin(2 * np.pi * freq * t)
        
        if add_harmonics:
            # Add subtle harmonics for a richer, more organic sound
            # 2nd harmonic at -12dB, 3rd at -18dB, 5th at -24dB
            audio += 0.25 * np.sin(2 * np.pi * freq * 2 * t)  # Octave
            audio += 0.125 * np.sin(2 * np.pi * freq * 3 * t)  # Perfect fifth + octave
            audio += 0.0625 * np.sin(2 * np.pi * freq * 5 * t)  # Major third + 2 octaves
        
        # Normalize and apply fades
        audio = AudioSafeGuard.normalize(audio, target_db=-6.0)
        audio = AudioSafeGuard.apply_fade(audio, sample_rate, fade_in_ms=1000, fade_out_ms=1000)
        
        return audio
    
    def generate_cascade(self, duration_sec: int = 60, sample_rate: int = 44100) -> np.ndarray:
        """
        Generate all main Solfeggio frequencies layered together.
        Creates a rich, complex healing soundscape.
        """
        print(f"[Solfeggio] Generating Cascade: All frequencies layered")
        
        main_freqs = [396, 417, 528, 639, 741, 852]  # Core Solfeggio set
        
        t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
        audio = np.zeros_like(t)
        
        for freq in main_freqs:
            # Each frequency at reduced volume to leave headroom
            audio += np.sin(2 * np.pi * freq * t) * 0.15
        
        audio = AudioSafeGuard.normalize(audio, target_db=-3.0)
        audio = AudioSafeGuard.apply_fade(audio, sample_rate, fade_in_ms=2000, fade_out_ms=2000)
        
        return audio
