import numpy as np
from safety import AudioSafeGuard

class BinauralBeatGenerator:
    """
    Generates Binaural Beats for brainwave entrainment.
    
    Binaural beats work by playing slightly different frequencies in each ear.
    The brain perceives the difference as a rhythmic beat and entrains to it.
    
    Frequency Ranges:
    - Delta (0.5-4 Hz): Deep sleep, healing
    - Theta (4-8 Hz): Meditation, creativity
    - Alpha (8-12 Hz): Relaxation, calm focus
    - Beta (12-30 Hz): Alertness, concentration
    - Gamma (30-100 Hz): Peak performance, insight
    """
    
    PRESETS = {
        'delta_sleep': {'carrier': 200, 'beat_freq': 2.0, 'description': 'Deep Sleep & Healing'},
        'theta_meditation': {'carrier': 200, 'beat_freq': 6.0, 'description': 'Deep Meditation'},
        'alpha_relaxation': {'carrier': 200, 'beat_freq': 10.0, 'description': 'Calm & Relaxed'},
        'beta_focus': {'carrier': 200, 'beat_freq': 18.0, 'description': 'Focused Attention'},
        'gamma_insight': {'carrier': 200, 'beat_freq': 40.0, 'description': 'Peak Performance'},
    }
    
    def generate(self, preset: str = 'alpha_relaxation', duration_sec: int = 60, 
                 sample_rate: int = 44100, carrier_freq: float = None, 
                 beat_freq: float = None) -> np.ndarray:
        """
        Generate a binaural beat audio track (stereo).
        
        Args:
            preset: One of the preset names (delta_sleep, theta_meditation, etc.)
            duration_sec: Length of the audio in seconds
            sample_rate: Audio sample rate
            carrier_freq: Custom carrier frequency (overrides preset)
            beat_freq: Custom beat frequency (overrides preset)
            
        Returns:
            2D numpy array with shape (samples, 2) for stereo
        """
        # Get preset or use custom values
        if preset in self.PRESETS:
            settings = self.PRESETS[preset]
            carrier = carrier_freq or settings['carrier']
            beat = beat_freq or settings['beat_freq']
        else:
            carrier = carrier_freq or 200
            beat = beat_freq or 10.0
        
        print(f"[Binaural] Generating: Carrier={carrier}Hz, Beat={beat}Hz, Duration={duration_sec}s")
        
        # Calculate frequencies for each ear
        left_freq = carrier
        right_freq = carrier + beat
        
        # Generate time array
        t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
        
        # Generate sine waves for each channel
        left_channel = np.sin(2 * np.pi * left_freq * t)
        right_channel = np.sin(2 * np.pi * right_freq * t)
        
        # Normalize each channel
        left_channel = AudioSafeGuard.normalize(left_channel, target_db=-6.0)
        right_channel = AudioSafeGuard.normalize(right_channel, target_db=-6.0)
        
        # Apply fades
        left_channel = AudioSafeGuard.apply_fade(left_channel, sample_rate)
        right_channel = AudioSafeGuard.apply_fade(right_channel, sample_rate)
        
        # Stack into stereo
        stereo = np.column_stack((left_channel, right_channel))
        
        return stereo


class IsochronicToneGenerator:
    """
    Generates Isochronic Tones - rhythmically pulsating tones at specific frequencies.
    
    Unlike binaural beats, isochronic tones work in mono and use amplitude modulation
    to create distinct pulses that the brain can entrain to.
    """
    
    PRESETS = {
        'theta_deep': {'carrier': 300, 'pulse_freq': 6.0, 'duty_cycle': 0.5},
        'alpha_flow': {'carrier': 400, 'pulse_freq': 10.0, 'duty_cycle': 0.5},
        'beta_active': {'carrier': 500, 'pulse_freq': 20.0, 'duty_cycle': 0.4},
        'gamma_peak': {'carrier': 600, 'pulse_freq': 40.0, 'duty_cycle': 0.3},
    }
    
    def generate(self, preset: str = 'alpha_flow', duration_sec: int = 60,
                 sample_rate: int = 44100, carrier_freq: float = None,
                 pulse_freq: float = None, duty_cycle: float = None) -> np.ndarray:
        """
        Generate an isochronic tone audio track.
        
        Args:
            preset: Preset name
            duration_sec: Length of audio
            sample_rate: Sample rate
            carrier_freq: The main tone frequency
            pulse_freq: How many pulses per second (entrainment frequency)
            duty_cycle: Ratio of on-time to off-time (0-1)
            
        Returns:
            Mono numpy array
        """
        if preset in self.PRESETS:
            settings = self.PRESETS[preset]
            carrier = carrier_freq or settings['carrier']
            pulse = pulse_freq or settings['pulse_freq']
            duty = duty_cycle if duty_cycle is not None else settings['duty_cycle']
        else:
            carrier = carrier_freq or 400
            pulse = pulse_freq or 10.0
            duty = duty_cycle if duty_cycle is not None else 0.5
            
        print(f"[Isochronic] Generating: Carrier={carrier}Hz, Pulse={pulse}Hz, Duty={duty}")
        
        t = np.linspace(0, duration_sec, int(sample_rate * duration_sec), endpoint=False)
        
        # Generate carrier tone
        carrier_wave = np.sin(2 * np.pi * carrier * t)
        
        # Generate pulse envelope using square wave
        # Use sawtooth phase for clean on/off
        pulse_phase = (t * pulse) % 1.0
        envelope = (pulse_phase < duty).astype(float)
        
        # Smooth the envelope to avoid clicks
        # Simple smoothing: convolve with a small window
        window_size = int(sample_rate * 0.005)  # 5ms smoothing
        if window_size > 0:
            window = np.hanning(window_size * 2)
            envelope = np.convolve(envelope, window / window.sum(), mode='same')
        
        # Apply envelope to carrier
        audio = carrier_wave * envelope
        
        # Safety processing
        audio = AudioSafeGuard.normalize(audio, target_db=-3.0)
        audio = AudioSafeGuard.apply_fade(audio, sample_rate)
        
        return audio
