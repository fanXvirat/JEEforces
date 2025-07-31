// src/app/api/revise/get-session-key/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import crypto from 'crypto';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?._id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serverSecret = process.env.NEXTAUTH_SECRET;
    if (!serverSecret) {
        console.error("NEXTAUTH_SECRET is not set. Cannot generate a secure session key.");
        return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
    }

    // Create a stable, user-specific key using HMAC.
    // This key is deterministic for a given user but secret to everyone else.
    // It's never stored; it's recalculated on every request.
    const sessionKey = crypto
        .createHmac('sha256', serverSecret)
        .update(session.user._id)
        .digest('hex');
        
    // Return the first 32 bytes (256 bits), which is the required length for AES-256.
    return NextResponse.json({ sessionKey: sessionKey.slice(0, 32) });
}