import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    if (user.isVerified) {
      return NextResponse.json({ message: "User already verified" }, { status: 400 });
    }

    // ─── Cooldown check ──────────────────────────────────────────────────────
    const now = new Date();
    if (user.resendCooldown && user.resendCooldown > now) {
      const minutesLeft = Math.ceil((user.resendCooldown.getTime() - now.getTime()) / 60000);
      return NextResponse.json(
        { message: `Please wait ${minutesLeft} minute(s) before requesting again.` },
        { status: 429 }
      );
    }

    // ─── Generate new token, expiration & cooldown ──────────────────────────
    const token       = crypto.randomBytes(32).toString("hex");
    const expiryDate  = new Date(now.getTime() + 60 * 60 * 1000);     // 1 hour
    const cooldown    = new Date(now.getTime() + 10 * 60 * 1000);     // 10 minutes

    user.verifyToken     = token;
    user.verifyTokenExp  = expiryDate;
    user.resendCooldown  = cooldown;
    await user.save();

    // ─── Send email ─────────────────────────────────────────────────────────
    const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`;
    await resend.emails.send({
      from:    'JEEForces <verify@jeeforces.me>',
      to:      email,
      subject: "Resend: Verify your JEEForces account",
      html: `
        <p>Hi ${user.username},</p>
        <p>You requested a new verification link. Click <a href="${verifyUrl}">here</a> to verify (expires in 1 hour).</p>
      `
    });

    return NextResponse.json(
      { message: "Verification email sent—check your inbox!" },
      { status: 200 }
    );

  } catch (err: any) {
    console.error("🔥 [resend-verification] ERROR:", err);
    return NextResponse.json(
      { message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
