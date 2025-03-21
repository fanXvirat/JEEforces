import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose, { mongo } from "mongoose";
export async function POST(request: Request){
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User=session?.user;
    if(!session || !user.role || user.role!="admin"){
        return Response.json({error:"Unauthorized"},{status:401});
    }
    const data=await request.json();
    try {
        const newContest=await ContestModel.create({
            name:data.name,
            description:data.description,
            startTime:data.startTime,
            endTime:data.endTime,
            participants:[],
            problems:data.problems,
            ispublished:false,
            leaderboard:[],
        });
        return Response.json(newContest,{status:201});
    } catch (error) {
        console.log(error);
        return Response.json({error:"Internal Server Error"},{status:500});
        
    }
}


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

  try {
    const url = new URL(request.url);
    const contestId = url.searchParams.get("id");

    if (contestId) {
      // Fetch a specific contest by ID
      const contest = await ContestModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(contestId) } },
        {
          $lookup: {
            from: "problems",
            localField: "problems",
            foreignField: "_id",
            as: "problems",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdby",
            foreignField: "_id",
            as: "createdby",
          },
        },
        {
          $addFields: {
            createdby: { $arrayElemAt: ["$createdby", 0] }, // Unwind createdby
            participantsCount: { $size: "$participants" }, // Add participants count
          },
        },
        {
          $project: {
            "problems.description": 0, // Exclude problem descriptions
            "participants.password": 0, // Exclude sensitive user data
            "createdby.password": 0, // Exclude sensitive user data
          },
        },
      ]);

      if (!contest || contest.length === 0) {
        console.error("Contest not found");
        return Response.json({ error: "Contest not found" }, { status: 404 });
      }

      return Response.json(contest[0]);
    } else {
      // Fetch all contests
      const contests = await ContestModel.aggregate([
        {
          $lookup: {
            from: "problems",
            localField: "problems",
            foreignField: "_id",
            as: "problems",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdby",
            foreignField: "_id",
            as: "createdby",
          },
        },
        {
          $addFields: {
            createdby: { $arrayElemAt: ["$createdby", 0] }, // Unwind createdby
            participantsCount: { $size: "$participants" }, // Add participants count
          },
        },
        {
          $project: {
            "problems.description": 0, // Exclude problem descriptions
            "participants.password": 0, // Exclude sensitive user data
            "createdby.password": 0, // Exclude sensitive user data
          },
        },
      ]);

      return Response.json(contests);
    }
  } catch (error) {
    console.error("Error fetching contests:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}