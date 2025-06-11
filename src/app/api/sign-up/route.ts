// app/api/sign-up/route.ts
import { NextResponse } from "next/server";
import dbConnect          from "@/lib/dbConnect";
import UserModel          from "@/backend/models/User.model";
import bcrypt             from "bcryptjs";
import crypto             from "crypto";
import nodemailer         from "nodemailer";

export async function POST(request: Request) {
  // 1) connect DB
  try {
    await dbConnect();
  } catch (err) {
    console.error("🔥 [sign-up] dbConnect failed:", err);
    return NextResponse.json({ message: "Database connection error" }, { status: 500 });
  }

  let payload: { username: string; email: string; password: string };
  try {
    payload = await request.json();
  } catch (err) {
    console.error("🔥 [sign-up] invalid JSON:", err);
    return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
  }

  const { username, email, password } = payload;
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
    const { EMAIL_SERVER, EMAIL_FROM, NEXTAUTH_URL } = process.env;
    console.log({ EMAIL_SERVER, EMAIL_FROM, NEXTAUTH_URL });
    if (!EMAIL_SERVER || !EMAIL_FROM || !NEXTAUTH_URL) {
      console.error("🔥 [sign-up] missing env-vars");
      throw new Error("Email configuration incomplete");
    }

    // 5) setup transporter
    let transporter = nodemailer.createTransport(EMAIL_SERVER);
    // **verify SMTP right now**
    transporter.verify((error, success) => {
      if (error) console.error("🔥 [sign-up] SMTP verify failed:", error);
      else console.log("✅ [sign-up] SMTP server is ready");
    });

    // 6) send mail
    const verifyUrl = `${NEXTAUTH_URL}/api/auth/verify?token=${token}`;
    await transporter.sendMail({
      from:    EMAIL_FROM,
      to:      email,
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
