import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Valid generator types
const VALID_TYPES = [
    'spectral', 'silent',
    'binaural', 'isochronic',
    'pink_noise', 'brown_noise', 'white_noise',
    'solfeggio'
];

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { type, text, duration, preset, frequency } = body;

        // Validate type
        if (!type || !VALID_TYPES.includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type', valid_types: VALID_TYPES },
                { status: 400 }
            );
        }

        // Text is required only for spectral and silent
        if ((type === 'spectral' || type === 'silent') && !text) {
            return NextResponse.json({ error: 'Text is required for spectral/silent' }, { status: 400 });
        }

        // Setup paths
        const projectRoot = process.cwd();
        const scriptPath = path.join(projectRoot, 'src', 'engine', 'main.py');
        const tempDir = os.tmpdir();
        const fileName = `gen_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
        const outputPath = path.join(tempDir, fileName);

        // Build command arguments
        let cmdArgs = `"${scriptPath}" ${type} --out "${outputPath}" --duration ${duration || 60}`;

        // Add type-specific arguments
        if (text) {
            cmdArgs += ` --text "${text.replace(/"/g, '\\"')}"`;
        }
        if (preset) {
            cmdArgs += ` --preset "${preset}"`;
        }
        if (frequency) {
            cmdArgs += ` --frequency "${frequency}"`;
        }

        const cmd = `python ${cmdArgs}`;
        console.log("Executing:", cmd);

        const { stdout, stderr } = await execAsync(cmd, { timeout: 120000 }); // 2 min timeout

        if (stderr) {
            console.error("Python Stderr:", stderr);
        }
        console.log("Python Stdout:", stdout);

        // Read the generated file
        if (!fs.existsSync(outputPath)) {
            throw new Error("Output file was not created");
        }

        const audioBuffer = fs.readFileSync(outputPath);

        // Cleanup
        fs.unlinkSync(outputPath);

        // Return audio
        return new NextResponse(audioBuffer, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Disposition': `attachment; filename="${type}_generated.wav"`,
            },
        });

    } catch (error: any) {
        console.error('Generation Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate audio', details: error.message },
            { status: 500 }
        );
    }
}
