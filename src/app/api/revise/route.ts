// src/app/api/revise/route.ts
import { NextResponse } from 'next/server';
import { generateRevisionFeed, validateAndStructureTopic, generateExplanation } from '@/lib/ai/gemini';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

// This function will now be responsible for getting the key and handling the error
function getApiKeyFromRequest(payload: any): string | null {
    // In our new frontend, we will pass the key from local storage with each request
    return payload.apiKey || null;
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { action, ...payload } = await request.json();

        // Centralized API Key check
        const apiKey = getApiKeyFromRequest(payload);
        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API Key was not provided with the request." }, { status: 400 });
        }
        
        switch (action) {
            case 'validate_topic': {
                const { userInput } = payload;
                if (!userInput) return NextResponse.json({ error: "User input is required" }, { status: 400 });
                try {
                    const structuredTopic = await validateAndStructureTopic(userInput, apiKey); // Pass apiKey
                    // If we reach here, it means isValid was true
                    return NextResponse.json({
                        isValid: true,
                        topicName: structuredTopic.name,
                        subject: structuredTopic.subject
                    });
                } catch (error: any) {
                    // If we reach here, it means isValid was false
                    return NextResponse.json({
                        isValid: false,
                        reason: error.message
                    });
                }
            }

            case 'generate_feed': {
                const { topic, history } = payload;
                if (!topic) return NextResponse.json({ error: "A valid topic is required" }, { status: 400 });
                const feed = await generateRevisionFeed(topic, history || [], apiKey); // Pass apiKey
                return NextResponse.json(feed);
            }
            
            case 'generate_explanation': {
                const { topic, question, incorrectAnswer, correctAnswer } = payload;
                if (!topic || !question || !incorrectAnswer || !correctAnswer) {
                     return NextResponse.json({ error: "Missing parameters for explanation" }, { status: 400 });
                }
                const explanation = await generateExplanation(topic, question, incorrectAnswer, correctAnswer, apiKey); // Pass apiKey
                return NextResponse.json({ explanation });
            }

            default:
                return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Error in /api/revise:", error);
        // Catch specific Gemini errors if possible
        
        if (error.message?.includes("API key not valid")) {
            return NextResponse.json({ error: "Your Gemini API Key is invalid. Please check it and try again." }, { status: 403 });
        }
        return NextResponse.json(
            { error: error.message || "An internal server error occurred." },
            { status: 500 }
        );
    }
}