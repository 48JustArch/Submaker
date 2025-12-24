import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    // Read directly from process.env inside the handler to ensure latest value
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('Gemini Check - Key exists:', !!apiKey);

    if (!apiKey) {
        console.warn('Missing GEMINI_API_KEY, falling back to mock data.');
        const { topic } = await req.json();
        return NextResponse.json({
            affirmations: [
                `I am fully confident in my ability to master ${topic || 'life'}.`,
                `Every day, I grow stronger and more capable in ${topic || 'everything I do'}.`,
                `I radiate positive energy and attract success in ${topic || 'abundance'}.`,
                `My mind is attuned to the frequency of ${topic || 'greatness'}.`,
                `I effortlessly achieve my goals regarding ${topic || 'my dreams'}.`
            ]
        });
    }

    try {
        const { topic } = await req.json();
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `Generate 5 powerful, present-tense, "I am" style affirmations focused on the topic: "${topic}". 
        Return ONLY the affirmations as a JSON array of strings. Do not include any markdown formatting or extra text.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the text to ensure it's valid JSON
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const affirmations = JSON.parse(cleanedText);

        return NextResponse.json({ affirmations });
    } catch (error) {
        console.error('Error generating affirmations:', error);
        return NextResponse.json(
            { error: 'Failed to generate affirmations' },
            { status: 500 }
        );
    }
}
