import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Limit text length for TTS services
        const cleanText = text.trim().substring(0, 1000);

        // Strategy 1: TikTok TTS (via Weilnet proxy)
        // en_us_001: Female (Standard)
        // en_us_006: Male (Standard)
        const voiceId = voice === 'female' ? 'en_us_001' : 'en_us_006';

        console.log(`[TTS] Attempting TikTok API for voice: ${voiceId}`);

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

            const tiktokResponse = await fetch('https://tiktok-tts.weilnet.workers.dev/api/generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: cleanText.substring(0, 300),
                    voice: voiceId
                }),
                signal: controller.signal
            });

            clearTimeout(timeout);

            if (tiktokResponse.ok) {
                const data = await tiktokResponse.json();
                if (data.data) {
                    console.log('[TTS] TikTok success');
                    const audioBuffer = Buffer.from(data.data, 'base64');
                    return new NextResponse(audioBuffer, {
                        headers: {
                            'Content-Type': 'audio/mp3',
                            'Content-Disposition': `attachment; filename="affirmations.mp3"`,
                        },
                    });
                }
            }
            console.warn(`[TTS] TikTok failed with status: ${tiktokResponse.status}`);
        } catch (ttError: any) {
            console.warn('[TTS] TikTok error:', ttError.message || ttError, '- falling back');
        }

        // Strategy 2: Google Translate TTS (Unofficial)
        console.log('[TTS] Falling back to Google Translate TTS...');

        try {
            const chunks = cleanText.match(/.{1,180}(?:\s|$)/g) || [cleanText];
            const audioBuffers: ArrayBuffer[] = [];

            for (const chunk of chunks) {
                if (!chunk.trim()) continue;

                const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(chunk.trim())}`;

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(googleTtsUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (!response.ok) {
                    throw new Error(`Google TTS chunk failed: ${response.status}`);
                }

                const buffer = await response.arrayBuffer();
                audioBuffers.push(buffer);
            }

            if (audioBuffers.length === 0) {
                throw new Error('No audio generated from Google TTS');
            }

            // Concatenate buffers
            const totalLength = audioBuffers.reduce((acc, buf) => acc + buf.byteLength, 0);
            const combinedBuffer = new Uint8Array(totalLength);
            let offset = 0;
            for (const buf of audioBuffers) {
                combinedBuffer.set(new Uint8Array(buf), offset);
                offset += buf.byteLength;
            }

            console.log('[TTS] Google TTS success');
            return new NextResponse(combinedBuffer, {
                headers: {
                    'Content-Type': 'audio/mpeg',
                    'Content-Disposition': `attachment; filename="affirmations.mp3"`,
                },
            });
        } catch (googleError: any) {
            console.warn('[TTS] Google TTS error:', googleError.message || googleError);
        }

        // Strategy 3: Return error with instruction
        console.error('[TTS] All TTS providers failed');
        return NextResponse.json(
            {
                error: 'TTS services are temporarily unavailable. Please try again later or use shorter text.',
                suggestion: 'Copy the affirmations to use with your preferred TTS software or record manually.'
            },
            { status: 503 }
        );

    } catch (error: any) {
        console.error('[TTS] Server Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate audio. Please try again.' },
            { status: 500 }
        );
    }
}
