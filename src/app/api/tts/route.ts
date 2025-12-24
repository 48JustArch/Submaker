import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Strategy 1: TikTok TTS (via public Weilnet proxy)
        // Supports distinct Male/Female voices
        // en_us_001: Female (Standard)
        // en_us_006: Male (Standard)
        const voiceId = voice === 'female' ? 'en_us_001' : 'en_us_006';

        console.log(`Attempting TikTok TTS for voice: ${voiceId} (${voice})`);

        try {
            const tiktokResponse = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text.substring(0, 300), // TikTok limit is usually 300 chars
                    voice: voiceId
                })
            });

            if (tiktokResponse.ok) {
                const data = await tiktokResponse.json();
                if (data.data) {
                    // Response is base64 encoded audio
                    const audioBuffer = Buffer.from(data.data, 'base64');
                    return new NextResponse(audioBuffer, {
                        headers: {
                            'Content-Type': 'audio/mp3',
                            'Content-Disposition': `attachment; filename="affirmations.mp3"`,
                        },
                    });
                }
            }
            console.warn(`TikTok TTS failed (${tiktokResponse.status}), falling back to Google...`);
        } catch (ttError) {
            console.warn('TikTok TTS error:', ttError, 'Falling back to Google...');
        }

        // Strategy 2: Fallback to Google Translate TTS (Unofficial) - Always Female-sounding
        console.log('Falling back to Google TTS...');

        // Google has a strict char limit, so we chunk it.
        const chunks = text.match(/.{1,180}(?:\s|$)/g) || [text];
        const audioBuffers: ArrayBuffer[] = [];

        for (const chunk of chunks) {
            if (!chunk.trim()) continue;

            // Google Translate TTS (Unofficial)
            const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk.trim())}`;

            const response = await fetch(googleTtsUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error(`Google TTS chunk failed: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            audioBuffers.push(buffer);
        }

        if (audioBuffers.length === 0) {
            throw new Error('No audio generated');
        }

        // Concatenate buffers
        const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
        const combinedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        for (const buf of audioBuffers) {
            combinedBuffer.set(new Uint8Array(buf), offset);
            offset += buf.byteLength;
        }

        return new NextResponse(combinedBuffer, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Disposition': `attachment; filename="affirmations-fallback.mp3"`,
            },
        });

    } catch (error) {
        console.error('Server TTS Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate audio. Please check server logs.' },
            { status: 500 }
        );
    }
}
