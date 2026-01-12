import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

// Valid generator types - whitelist only
const VALID_TYPES = [
    'spectral', 'silent',
    'binaural', 'isochronic',
    'pink_noise', 'brown_noise', 'white_noise',
    'solfeggio'
] as const;

type GeneratorType = typeof VALID_TYPES[number];

// Valid presets for solfeggio
const VALID_PRESETS = [
    '174', '285', '396', '417', '432', '528', '639', '741', '852', '963'
] as const;

// Input validation helpers
function isValidType(type: string): type is GeneratorType {
    return VALID_TYPES.includes(type as GeneratorType);
}

function sanitizeText(text: string): string {
    // Remove any control characters and limit length
    return text
        .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
        .slice(0, 1000); // Max 1000 characters
}

function isValidDuration(duration: unknown): duration is number {
    const num = Number(duration);
    return !isNaN(num) && num >= 1 && num <= 600; // 1 second to 10 minutes max
}

function isValidFrequency(frequency: unknown): frequency is number {
    const num = Number(frequency);
    return !isNaN(num) && num >= 20 && num <= 20000; // Human hearing range
}

function isValidPreset(preset: string): boolean {
    return VALID_PRESETS.includes(preset as typeof VALID_PRESETS[number]);
}

// Execute Python script safely using spawn (not exec)
function runPythonScript(args: string[]): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', args, {
            timeout: 120000, // 2 minute timeout
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        pythonProcess.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                resolve({ stdout, stderr });
            } else {
                reject(new Error(`Python process exited with code ${code}: ${stderr}`));
            }
        });

        pythonProcess.on('error', (err) => {
            reject(err);
        });

        // Kill if timeout
        setTimeout(() => {
            pythonProcess.kill('SIGTERM');
            reject(new Error('Python process timed out'));
        }, 120000);
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, text, duration, preset, frequency } = body;

        // ========== STRICT INPUT VALIDATION ==========

        // 1. Validate type (required, must be in whitelist)
        if (!type || typeof type !== 'string' || !isValidType(type)) {
            return NextResponse.json(
                { error: 'Invalid type', valid_types: VALID_TYPES },
                { status: 400 }
            );
        }

        // 2. Validate text (required for spectral/silent)
        let sanitizedText: string | undefined;
        if (type === 'spectral' || type === 'silent') {
            if (!text || typeof text !== 'string') {
                return NextResponse.json(
                    { error: 'Text is required for spectral/silent generation' },
                    { status: 400 }
                );
            }
            sanitizedText = sanitizeText(text);
            if (sanitizedText.length === 0) {
                return NextResponse.json(
                    { error: 'Text cannot be empty after sanitization' },
                    { status: 400 }
                );
            }
        }

        // 3. Validate duration
        const validDuration = isValidDuration(duration) ? duration : 60;

        // 4. Validate preset (if provided)
        if (preset !== undefined && typeof preset === 'string' && !isValidPreset(preset)) {
            return NextResponse.json(
                { error: 'Invalid preset', valid_presets: VALID_PRESETS },
                { status: 400 }
            );
        }

        // 5. Validate frequency (if provided)
        if (frequency !== undefined && !isValidFrequency(frequency)) {
            return NextResponse.json(
                { error: 'Invalid frequency. Must be between 20 and 20000 Hz.' },
                { status: 400 }
            );
        }

        // ========== BUILD SAFE COMMAND ARGUMENTS ==========

        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'src', 'engine', 'main.py');
        const tempDir = os.tmpdir();
        const fileName = `gen_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
        const outputPath = path.join(tempDir, fileName);

        // Build arguments array (safe from injection)
        const args: string[] = [
            scriptPath,
            type,
            '--out', outputPath,
            '--duration', String(validDuration)
        ];

        // Add optional arguments
        if (sanitizedText) {
            args.push('--text', sanitizedText);
        }
        if (preset && isValidPreset(preset)) {
            args.push('--preset', preset);
        }
        if (frequency && isValidFrequency(frequency)) {
            args.push('--frequency', String(frequency));
        }

        console.log('Executing Python script with args:', args);

        // ========== EXECUTE SAFELY ==========

        const { stdout, stderr } = await runPythonScript(args);

        if (stderr) {
            console.warn('Python stderr:', stderr);
        }
        console.log('Python stdout:', stdout);

        // ========== RETURN RESULT ==========

        // Verify output file exists
        if (!fs.existsSync(outputPath)) {
            throw new Error('Output file was not created by the generator');
        }

        const audioBuffer = fs.readFileSync(outputPath);

        // Cleanup temp file
        try {
            fs.unlinkSync(outputPath);
        } catch (cleanupError) {
            console.warn('Failed to cleanup temp file:', cleanupError);
        }

        // Return audio file
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Disposition': `attachment; filename="${type}_generated.wav"`,
                'Cache-Control': 'no-store'
            },
        });

    } catch (error: unknown) {
        console.error('Generation Error:', error);

        const message = error instanceof Error ? error.message : 'Unknown error occurred';

        return NextResponse.json(
            { error: 'Failed to generate audio', details: message },
            { status: 500 }
        );
    }
}
