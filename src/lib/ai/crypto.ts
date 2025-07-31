// src/lib/revise/crypto.ts

// Helper to convert ArrayBuffer to Base64 string for storage
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper to convert Base64 string back to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

// Imports a raw secret key for use with SubtleCrypto
async function getKeyMaterial(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return await window.crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypts the user's API key using the session key
export async function encryptApiKey(apiKey: string, sessionKey: string): Promise<{ encryptedData: string; iv: string } | null> {
    try {
        const keyMaterial = await getKeyMaterial(sessionKey);
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
        const enc = new TextEncoder();

        const encryptedData = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            keyMaterial,
            enc.encode(apiKey)
        );

        return {
            encryptedData: arrayBufferToBase64(encryptedData),
            iv: arrayBufferToBase64(iv.buffer),
        };
    } catch (error) {
        console.error("Encryption failed:", error);
        return null;
    }
}

// Decrypts the blob from localStorage using the session key
export async function decryptApiKey(encryptedData: string, iv: string, sessionKey: string): Promise<string | null> {
    try {
        const keyMaterial = await getKeyMaterial(sessionKey);
        const encryptedBuffer = base64ToArrayBuffer(encryptedData);
        const ivBuffer = base64ToArrayBuffer(iv);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBuffer },
            keyMaterial,
            encryptedBuffer
        );
        
        const dec = new TextDecoder();
        return dec.decode(decryptedBuffer);
    } catch (error) {
        console.error("Decryption failed. This can happen if the session key is wrong or the data is corrupt.", error);
        // It's safer to clear the corrupted data from storage
        localStorage.removeItem('gemini_api_key_blob_jeeforces');
        return null;
    }
}