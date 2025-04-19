// app/api/users/[username]/route.ts
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { NextResponse } from 'next/server';
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  await dbConnect();

  try {
    const user = await UserModel.findOne({ username: params.username })
      .select('-password -email -isVerified -role -createdAt -updatedAt')
      .lean();

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}