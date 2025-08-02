// src/app/api/revise/get-session-key/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
    const { deviceId } = await request.json();
    if (!deviceId) {
        return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
    }

    const serverSecret = process.env.NEXTAUTH_SECRET;
    if (!serverSecret) {
        console.error("NEXTAUTH_SECRET is not set. Cannot generate a secure session key.");
        return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // MODIFIED: Use deviceId instead of session.user._id
    const sessionKey = crypto
        .createHmac('sha256', serverSecret)
        .update(deviceId) // Changed from session.user._id
        .digest('hex');
        
    // Return the first 32 bytes (256 bits), which is the required length for AES-256.
    return NextResponse.json({ sessionKey: sessionKey.slice(0, 32) });
}