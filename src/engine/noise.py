import numpy as np
from safety import AudioSafeGuard

class PinkNoiseGenerator:
    """
    Generates Pink Noise (1/f noise).
    
    Pink noise has equal energy per octave, making it sound more natural and soothing
    than white noise. It's often used for:
    - Sleep aid
    - Concentration/focus
    - Masking distracting sounds
    - Tinnitus relief
    """
    
    def generate(self, duration_sec: int = 60, sample_rate: int = 44100) -> np.ndarray:
        """
        Generate pink noise using the Voss-McCartney algorithm.
        """
        print(f"[Pink Noise] Generating: Duration={duration_sec}s")
        
        samples = int(sample_rate * duration_sec)
        
        # Voss-McCartney algorithm for pink noise
        # Use multiple rows of random values that update at different rates
        num_rows = 16
        max_key = 2 ** num_rows
        
        output = np.zeros(samples)
        running_sum = 0
        rows = np.zeros(num_rows)
        
        for i in range(samples):
            key = i
            last_key = (i - 1) if i > 0 else 0
            diff = key ^ last_key
            
            for row in range(num_rows):
                if diff & (1 << row):
                    running_sum -= rows[row]
                    rows[row] = np.random.random() - 0.5
                    running_sum += rows[row]
            
            output[i] = running_sum / num_rows
        
        # Normalize
        output = AudioSafeGuard.normalize(output, target_db=-6.0)
        output = AudioSafeGuard.apply_fade(output, sample_rate, fade_in_ms=500, fade_out_ms=500)
        
        return output


class BrownNoiseGenerator:
    """
    Generates Brown Noise (Brownian/Red noise).
    
    Brown noise has more energy at lower frequencies, creating a deep, 
    rumbling sound like thunder or waterfalls. Excellent for:
    - Deep relaxation
    - Sleep
    - Blocking low-frequency distractions
    """
    
    def generate(self, duration_sec: int = 60, sample_rate: int = 44100) -> np.ndarray:
        """
        Generate brown noise using random walk (integration of white noise).
        """
        print(f"[Brown Noise] Generating: Duration={duration_sec}s")
        
        samples = int(sample_rate * duration_sec)
        
        # Generate white noise
        white = np.random.random(samples) * 2 - 1
        
        # Integrate (cumulative sum) to get brown noise
        brown = np.cumsum(white)
        
        # High-pass filter to remove DC offset and very low frequencies
        # Simple approach: subtract running mean
        window_size = int(sample_rate * 0.1)  # 100ms window
        if window_size > 0:
            kernel = np.ones(window_size) / window_size
            running_mean = np.convolve(brown, kernel, mode='same')
            brown = brown - running_mean
        
        # Normalize
        brown = AudioSafeGuard.normalize(brown, target_db=-6.0)
        brown = AudioSafeGuard.apply_fade(brown, sample_rate, fade_in_ms=500, fade_out_ms=500)
        
        return brown


class WhiteNoiseGenerator:
    """
    Generates White Noise.
    
    White noise has equal energy at all frequencies. Used for:
    - Sound masking
    - Testing audio equipment
    - Tinnitus therapy
    """
    
    def generate(self, duration_sec: int = 60, sample_rate: int = 44100) -> np.ndarray:
        """
        Generate white noise (uniform distribution).
        """
        print(f"[White Noise] Generating: Duration={duration_sec}s")
        
        samples = int(sample_rate * duration_sec)
        
        # Generate random samples
        white = np.random.random(samples) * 2 - 1
        
        # Normalize and apply fades
        white = AudioSafeGuard.normalize(white, target_db=-6.0)
        white = AudioSafeGuard.apply_fade(white, sample_rate, fade_in_ms=500, fade_out_ms=500)
        
        return white
