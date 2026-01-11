'use client';

/**
 * Web Audio Effects Chain
 * Implements actual audio processing for track effects
 */

// Effect types that can be applied
export type EffectType = 'reverb' | 'delay' | 'echo' | 'chorus' | 'subliminal-mask' | 'binaural-pan';

// Parameters for each effect type
export interface EffectParams {
    reverb: {
        decay: number; // 0-5 seconds
        wetDry: number; // 0-1
    };
    delay: {
        time: number; // 0-2 seconds
        feedback: number; // 0-0.9
        wetDry: number; // 0-1
    };
    echo: {
        delay: number; // 0.1-0.5 seconds
        feedback: number; // 0-0.8
        wetDry: number; // 0-1
    };
    chorus: {
        rate: number; // 0.1-8 Hz
        depth: number; // 0-20 ms
        wetDry: number; // 0-1
    };
    'subliminal-mask': {
        maskVolume: number; // 0-1 (how much to reduce vocal clarity)
        noiseAmount: number; // 0-1
    };
    'binaural-pan': {
        frequency: number; // 1-40 Hz binaural beat frequency
        panRate: number; // 0.1-2 Hz oscillation
    };
}

// Default parameters for each effect
export const DEFAULT_EFFECT_PARAMS: Record<EffectType, EffectParams[keyof EffectParams]> = {
    reverb: { decay: 2, wetDry: 0.3 },
    delay: { time: 0.3, feedback: 0.4, wetDry: 0.25 },
    echo: { delay: 0.25, feedback: 0.5, wetDry: 0.3 },
    chorus: { rate: 1.5, depth: 10, wetDry: 0.4 },
    'subliminal-mask': { maskVolume: 0.7, noiseAmount: 0.3 },
    'binaural-pan': { frequency: 10, panRate: 0.5 },
};

/**
 * Creates a reverb effect using ConvolverNode with generated impulse response
 */
export function createReverbEffect(
    ctx: AudioContext | OfflineAudioContext,
    params: EffectParams['reverb']
): { input: AudioNode; output: AudioNode; dispose: () => void } {
    const convolver = ctx.createConvolver();
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const output = ctx.createGain();

    // Generate impulse response
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * params.decay;
    const impulse = ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
            const t = i / length;
            // Exponential decay with random noise
            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
        }
    }

    convolver.buffer = impulse;

    // Set wet/dry mix
    wetGain.gain.value = params.wetDry;
    dryGain.gain.value = 1 - params.wetDry;

    // Connect: input -> convolver -> wetGain -> output
    //          input -> dryGain -> output
    convolver.connect(wetGain);
    wetGain.connect(output);
    dryGain.connect(output);

    // Input node that routes to both paths
    const input = ctx.createGain();
    input.connect(convolver);
    input.connect(dryGain);

    return {
        input,
        output,
        dispose: () => {
            input.disconnect();
            convolver.disconnect();
            wetGain.disconnect();
            dryGain.disconnect();
            output.disconnect();
        }
    };
}

/**
 * Creates a delay effect
 */
export function createDelayEffect(
    ctx: AudioContext | OfflineAudioContext,
    params: EffectParams['delay']
): { input: AudioNode; output: AudioNode; dispose: () => void } {
    const delay = ctx.createDelay(2);
    const feedback = ctx.createGain();
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const output = ctx.createGain();
    const input = ctx.createGain();

    delay.delayTime.value = params.time;
    feedback.gain.value = params.feedback;
    wetGain.gain.value = params.wetDry;
    dryGain.gain.value = 1 - params.wetDry;

    // Feedback loop
    input.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);

    // Wet path
    delay.connect(wetGain);
    wetGain.connect(output);

    // Dry path
    input.connect(dryGain);
    dryGain.connect(output);

    return {
        input,
        output,
        dispose: () => {
            input.disconnect();
            delay.disconnect();
            feedback.disconnect();
            wetGain.disconnect();
            dryGain.disconnect();
            output.disconnect();
        }
    };
}

/**
 * Creates a chorus effect using oscillating delay
 */
export function createChorusEffect(
    ctx: AudioContext | OfflineAudioContext,
    params: EffectParams['chorus']
): { input: AudioNode; output: AudioNode; dispose: () => void } {
    const delay = ctx.createDelay(0.1);
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const wetGain = ctx.createGain();
    const dryGain = ctx.createGain();
    const output = ctx.createGain();
    const input = ctx.createGain();

    // LFO modulates delay time
    lfo.frequency.value = params.rate;
    lfoGain.gain.value = params.depth / 1000; // Convert ms to seconds

    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);
    lfo.start();

    // Base delay time
    delay.delayTime.value = 0.02; // 20ms base delay

    wetGain.gain.value = params.wetDry;
    dryGain.gain.value = 1 - params.wetDry;

    input.connect(delay);
    delay.connect(wetGain);
    wetGain.connect(output);

    input.connect(dryGain);
    dryGain.connect(output);

    return {
        input,
        output,
        dispose: () => {
            lfo.stop();
            input.disconnect();
            delay.disconnect();
            lfo.disconnect();
            lfoGain.disconnect();
            wetGain.disconnect();
            dryGain.disconnect();
            output.disconnect();
        }
    };
}

/**
 * Creates a subliminal mask effect (lowpass filter + noise overlay)
 */
export function createSubliminalMaskEffect(
    ctx: AudioContext | OfflineAudioContext,
    params: EffectParams['subliminal-mask']
): { input: AudioNode; output: AudioNode; dispose: () => void } {
    const lowpass = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();
    const output = ctx.createGain();
    const input = ctx.createGain();

    lowpass.type = 'lowpass';
    lowpass.frequency.value = 800 + (1 - params.maskVolume) * 3000; // 800-3800 Hz
    lowpass.Q.value = 1;

    gainNode.gain.value = 1 - params.maskVolume * 0.5; // Reduce volume slightly

    input.connect(lowpass);
    lowpass.connect(gainNode);
    gainNode.connect(output);

    return {
        input,
        output,
        dispose: () => {
            input.disconnect();
            lowpass.disconnect();
            gainNode.disconnect();
            output.disconnect();
        }
    };
}

/**
 * Creates a binaural pan effect (stereo panning oscillation)
 */
export function createBinauralPanEffect(
    ctx: AudioContext | OfflineAudioContext,
    params: EffectParams['binaural-pan']
): { input: AudioNode; output: AudioNode; dispose: () => void } {
    const panner = ctx.createStereoPanner();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const input = ctx.createGain();

    lfo.frequency.value = params.panRate;
    lfoGain.gain.value = 0.8; // Pan range -0.8 to 0.8

    lfo.connect(lfoGain);
    lfoGain.connect(panner.pan);
    lfo.start();

    input.connect(panner);

    return {
        input,
        output: panner,
        dispose: () => {
            lfo.stop();
            input.disconnect();
            lfo.disconnect();
            lfoGain.disconnect();
            panner.disconnect();
        }
    };
}

/**
 * Creates an effect chain for a track
 */
export function createEffectChain(
    ctx: AudioContext | OfflineAudioContext,
    effects: Array<{ type: EffectType; active: boolean; params?: Record<string, number> }>
): { input: AudioNode; output: AudioNode; dispose: () => void } {
    if (effects.length === 0 || effects.every(e => !e.active)) {
        // No active effects, pass through
        const passthrough = ctx.createGain();
        return {
            input: passthrough,
            output: passthrough,
            dispose: () => passthrough.disconnect()
        };
    }

    const activeEffects = effects.filter(e => e.active);
    const nodes: Array<{ input: AudioNode; output: AudioNode; dispose: () => void }> = [];
    const input = ctx.createGain();

    let lastNode: AudioNode = input;

    for (const effect of activeEffects) {
        let effectNode: { input: AudioNode; output: AudioNode; dispose: () => void };

        switch (effect.type) {
            case 'reverb':
                effectNode = createReverbEffect(ctx, {
                    ...DEFAULT_EFFECT_PARAMS.reverb,
                    ...effect.params
                } as EffectParams['reverb']);
                break;
            case 'delay':
            case 'echo':
                effectNode = createDelayEffect(ctx, {
                    ...DEFAULT_EFFECT_PARAMS.delay,
                    ...effect.params
                } as EffectParams['delay']);
                break;
            case 'chorus':
                effectNode = createChorusEffect(ctx, {
                    ...DEFAULT_EFFECT_PARAMS.chorus,
                    ...effect.params
                } as EffectParams['chorus']);
                break;
            case 'subliminal-mask':
                effectNode = createSubliminalMaskEffect(ctx, {
                    ...DEFAULT_EFFECT_PARAMS['subliminal-mask'],
                    ...effect.params
                } as EffectParams['subliminal-mask']);
                break;
            case 'binaural-pan':
                effectNode = createBinauralPanEffect(ctx, {
                    ...DEFAULT_EFFECT_PARAMS['binaural-pan'],
                    ...effect.params
                } as EffectParams['binaural-pan']);
                break;
            default:
                continue;
        }

        lastNode.connect(effectNode.input);
        lastNode = effectNode.output;
        nodes.push(effectNode);
    }

    return {
        input,
        output: lastNode,
        dispose: () => {
            input.disconnect();
            nodes.forEach(n => n.dispose());
        }
    };
}

/**
 * Applies effects to an audio buffer and returns a new processed buffer
 */
export async function processAudioWithEffects(
    sourceBuffer: AudioBuffer,
    effects: Array<{ type: EffectType; active: boolean; params?: Record<string, number> }>,
    volume: number = 1
): Promise<AudioBuffer> {
    const offlineCtx = new OfflineAudioContext(
        sourceBuffer.numberOfChannels,
        sourceBuffer.length,
        sourceBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = sourceBuffer;

    const gainNode = offlineCtx.createGain();
    gainNode.gain.value = volume;

    const effectChain = createEffectChain(offlineCtx, effects);

    source.connect(effectChain.input);
    effectChain.output.connect(gainNode);
    gainNode.connect(offlineCtx.destination);

    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    effectChain.dispose();

    return renderedBuffer;
}
