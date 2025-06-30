// app/api/sign-up/route.ts
import { NextResponse } from "next/server";
import dbConnect          from "@/lib/dbConnect";
import UserModel          from "@/backend/models/User.model";
import bcrypt             from "bcryptjs";
import crypto             from "crypto";
import { Resend } from "resend";
import { z } from "zod";
import { usernameValidation } from "@/backend/schemas/Schemas";
import { verifyCaptcha } from "@/lib/captcha";
import { rateLimiter } from "@/lib/rate-limiter";
const signupSchema = z.object({
  username: usernameValidation,
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})
const resend = new Resend(process.env.RESEND_API_KEY);
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  
  // ⛔ Step 0: Rate limit check
  const { success } = await rateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { message: "Too many requests. Please try again in 5 minutes." },
      { status: 429 }
    );
  }
  // 1) connect DB
  try {
    await dbConnect();
  } catch (err) {
    console.error("🔥 [sign-up] dbConnect failed:", err);
    return NextResponse.json({ message: "Database connection error" }, { status: 500 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (err) {
    console.error("🔥 [sign-up] invalid JSON:", err);
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("captchaToken" in payload)
  ) {
    return NextResponse.json({ message: "Missing captchaToken" }, { status: 400 });
  }
  const { captchaToken, ...signupData } = payload as { captchaToken: string; [key: string]: any };
  const isHuman = await verifyCaptcha(captchaToken);
  if (!isHuman) {
    return NextResponse.json(
      { message: "CAPTCHA verification failed. Please try again." },
      { status: 403 } // 403 Forbidden is appropriate
    );
  }

  try {
    await dbConnect();
  } catch (err) {
    console.error("🔥 [sign-up] dbConnect failed:", err);
    return NextResponse.json({ message: "Database connection error" }, { status: 500 });
  }
  const validation = signupSchema.safeParse(signupData);
  if (!validation.success) {
    return NextResponse.json(
      { 
        message: "Invalid input", 
        errors: validation.error.flatten().fieldErrors 
      }, 
      { status: 400 }
    );
  }

  const { username, email, password } = validation.data;
  try {
    // 2) uniqueness checks
    if (await UserModel.findOne({ username })) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 });
    }
    if (await UserModel.findOne({ email })) {
      return NextResponse.json({ message: "Email already exists" }, { status: 400 });
    }

    // 3) hash + token
    const hashedPassword = await bcrypt.hash(password, 10);
    const token          = crypto.randomBytes(32).toString("hex");
    const expiryDate     = new Date(Date.now() + 1000 * 60 * 60);

    const newUser = new UserModel({
      username,
      email,
      password:       hashedPassword,
      verifyToken:    token,
      verifyTokenExp: expiryDate,
      isVerified:     false,
    });
    await newUser.save();
    console.log("✅ [sign-up] user saved:", newUser.id);

    // 4) validate env
    const { RESEND_API_KEY, NEXTAUTH_URL } = process.env;
    if (!RESEND_API_KEY || !NEXTAUTH_URL) {
      console.error("🔥 [sign-up] missing env-vars");
      throw new Error("Email configuration incomplete");
    }

    // 5) setup transporter
    const verifyUrl = `${NEXTAUTH_URL}/api/auth/verify?token=${token}`;
    await resend.emails.send({
      from: 'JEEForces <verify@jeeforces.me>', // Changed: Use resend.dev domain initially
      to: email,
      subject: "Verify your JEEForces account",
      html: `
        <p>Hi ${username},</p>
        <p>Click <a href="${verifyUrl}">this link</a> to verify (expires in 1h).</p>
      `,
    });
    console.log("✅ [sign-up] verification email sent to", email);

    return NextResponse.json(
      { message: "Signup successful — check email to verify" },
      { status: 201 }
    );

  } catch (err: any) {
    console.error("🔥 [sign-up] ERROR:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
