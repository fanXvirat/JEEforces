// /app/api/auth/verify.ts
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";

export async function GET(request: Request) {
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return new NextResponse("Invalid link", { status: 400 });

  const user = await UserModel.findOne({ verifyToken: token });
  if (
    !user ||
    !user.verifyTokenExp ||
    user.verifyTokenExp.getTime() < Date.now()
  ) {
    return new NextResponse("Link expired or invalid", { status: 400 });
  }

  user.isVerified     = true;
  user.verifyToken    = undefined;
  user.verifyTokenExp = undefined;
  await user.save();

  // redirect to your “email verified” page
  return NextResponse.redirect(new URL("/verified", request.url));
}
