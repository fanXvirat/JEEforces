import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose, { mongo } from "mongoose";
import { use } from "react";


export async function GET(request: Request) {
  await dbConnect();

  // Fetch session
  const session = await getServerSession(authOptions);
  const user: User = session?.user;

  console.log("Session:", session); // Log session
  console.log("User:", user); // Log user

  if (!session || !user) {
    console.error("Unauthorized: No session or user found");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate user ID
  let userId;
  try {
    userId = new mongoose.Types.ObjectId(user._id);
    console.log("User ID:", userId); // Log user ID
  } catch (error) {
    console.error("Invalid user ID:", error);
    return Response.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    // Fetch user data with aggregation
    const userData = await UserModel.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "contests",
          localField: "contestsParticipated",
          foreignField: "_id",
          as: "contestsJoined",
        },
      },
      {
        $lookup: {
          from: "submissions",
          localField: "_id",
          foreignField: "user",
          as: "submissions",
        },
      },
      {
        $addFields: {
          contestsJoinedCount: { $size: "$contestsJoined" },
          submissionsCount: { $size: "$submissions" },
        },
      },
      {
        $project: {
          // Exclude only - can't mix include/exclude
          password: 0,
          contestsJoined: 0, // We just need the count, not the full objects
          submissions: 0,    // We just need the count, not the full objects
        },
      },
    ]);

    console.log("User Data:", userData); // Log user data

    if (!userData || userData.length === 0) {
      console.error("User not found");
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json(userData[0]);
  } catch (error) {
    console.error("Error fetching user data:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    // PUT method remains unchanged
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user;

    if (!session || !user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(user._id);
    const data = await request.json();

    // Prevent username from being updated
    if ("username" in data) {
        return Response.json({ error: "Username cannot be changed" }, { status: 400 });
    }

    // Define allowed fields
    const allowedFields = ["avatar", "institute", "yearofstudy"];
    const updateData: Record<string, any> = {};

    // Filter only allowed fields
    for (const key of allowedFields) {
        if (key in data) {
            updateData[key] = data[key];
        }
    }

    // If no valid fields to update, return an error
    if (Object.keys(updateData).length === 0) {
        return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    try {
        const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
            new: true,
            select: "-password -email" // Hide sensitive fields
        });

        if (!updatedUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json(updatedUser);
    } catch (error) {
        console.error(error);
        
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}