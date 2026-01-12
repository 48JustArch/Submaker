import numpy as np

class AudioSafeGuard:
    """
    Ensures all generated audio adheres to safety standards:
    1. Volume Normalization (prevent clipping/ear damage).
    2. Frequency Clamping (prevent speaker damage from extreme ultrasonics).
    3. DataType Validation.
    """
    
    @staticmethod
    def normalize(audio_data: np.ndarray, target_db: float = -1.0) -> np.ndarray:
        """
        Normalizes audio to a safe peak level.
        target_db: Peak limit in dB (0.0 is max, -1.0 is safer).
        """
        max_val = np.max(np.abs(audio_data))
        if max_val == 0:
            return audio_data
        
        # Convert dB to linear scalar
        # 10^(dB/20)
        target_amp = 10 ** (target_db / 20)
        
        # Soft limiter logic: Only reduce if above target
        if max_val > target_amp:
            print(f"[SafeGuard] Reducing peak from {max_val:.2f} to {target_amp:.2f}")
            return audio_data * (target_amp / max_val)
        
        return audio_data

    @staticmethod
    def validate_frequency_range(min_freq: float, max_freq: float, sample_rate: int) -> bool:
        """
        Checks if frequencies are safe for the given sample rate.
        Nyquist Limit: Freq must be < SampleRate / 2
        """
        limit = sample_rate / 2
        if max_freq >= limit:
            print(f"[SafeGuard] WARNING: Frequency {max_freq}Hz exceeds Nyquist limit ({limit}Hz).")
            return False
        return True

    @staticmethod
    def apply_fade(audio_data: np.ndarray, sample_rate: int, fade_sec: float = 0.1,
                   fade_in_ms: int = None, fade_out_ms: int = None) -> np.ndarray:
        """
        Applies a quick fade-in/out to prevent 'clicking' at start/end.
        fade_in_ms/fade_out_ms override fade_sec if provided.
        """
        # Calculate fade samples
        if fade_in_ms is not None:
            fade_in_samples = int(sample_rate * fade_in_ms / 1000)
        else:
            fade_in_samples = int(sample_rate * fade_sec)
            
        if fade_out_ms is not None:
            fade_out_samples = int(sample_rate * fade_out_ms / 1000)
        else:
            fade_out_samples = int(sample_rate * fade_sec)
        
        # Ensure we don't exceed audio length
        max_fade = len(audio_data) // 2
        fade_in_samples = min(fade_in_samples, max_fade)
        fade_out_samples = min(fade_out_samples, max_fade)
            
        # Fade In
        if fade_in_samples > 0:
            fade_in = np.linspace(0, 1, fade_in_samples)
            audio_data[:fade_in_samples] *= fade_in
        
        # Fade Out
        if fade_out_samples > 0:
            fade_out = np.linspace(1, 0, fade_out_samples)
            audio_data[-fade_out_samples:] *= fade_out
        
        return audio_data
