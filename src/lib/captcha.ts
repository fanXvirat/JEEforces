// src/lib/captcha.ts
import axios from 'axios';

interface RecaptchaResponse {
  success: boolean;
  score: number;
  action: string;
  challenge_ts: string;
  hostname: string;
  'error-codes'?: string[];
}

/**
 * Verifies a reCAPTCHA v3 token with Google's API.
 * @param token The reCAPTCHA token from the client.
 * @returns {Promise<boolean>} True if the token is valid and the score is above the threshold, false otherwise.
 */
export async function verifyCaptcha(token: string | undefined): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';

  if (!secretKey) {
    console.error("reCAPTCHA secret key is not set. CAPTCHA verification skipped.");
    // In production, you should fail closed for security. For dev, you might fail open.
    // We return false to be secure.
    return false;
  }
  
  if (!token) {
    console.error("CAPTCHA token is missing from the request.");
    return false;
  }

  try {
    const response = await axios.post<RecaptchaResponse>(
      verificationUrl,
      null, // No body needed for POST, params are in URL
      {
        params: {
          secret: secretKey,
          response: token,
        },
      }
    );

    const { success, score } = response.data;

    // A score of 0.5 is a common threshold. You can adjust this.
    if (success && score > 0.5) {
      return true;
    } else {
      console.warn('Low score or failed reCAPTCHA verification:', response.data);
      return false;
    }
  } catch (error) {
    console.error('Error during reCAPTCHA verification:', error);
    return false;
  }
}