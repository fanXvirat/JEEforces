import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose from "mongoose";
import redis from "@/lib/redis"; // Import Redis client if needed
const SIDEBAR_CONTESTS_TTL = 60;
export async function GET(request: Request) {
  await dbConnect();
  const url = new URL(request.url);
  const contestId = url.searchParams.get("id");
  const forSidebar = url.searchParams.get("forSidebar") === "true"; // New query parameter

  const session = await getServerSession(authOptions);
  const user: User | undefined = session?.user; // Allow user to be undefined

  try {
    if (contestId && !forSidebar) { // Fetch specific contest (full details if needed)
      // Keep your existing detailed aggregation for a single contest view
      // but ensure it's still efficient. For participants, consider projecting only _id/username.
      const contest = await ContestModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(contestId) } },
        {
          $lookup: {
            from: "problems",
            localField: "problems",
            foreignField: "_id",
            as: "problems",
            pipeline: [{ $project: { _id: 1, title: 1 } }] // Project less problem data if only list is shown
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
            pipeline: [{ $project: { _id: 1, username: 1 } }] // Only ID and username for participants list
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdby",
            foreignField: "_id",
            as: "createdby",
            pipeline: [{ $project: { _id: 1, username: 1 } }] // Only ID and username for creator
          },
        },
        { $unwind: { path: "$createdby", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            participantsCount: { $size: "$participants" },
            isRegistered: user ? { $in: [new mongoose.Types.ObjectId(user._id), "$participants._id"] } : false
          },
        },
        {
          $project: {
            "problems.description": 0, // Exclude problem description for list/overview
          },
        },
      ]);

      if (!contest || contest.length === 0) {
        return Response.json({ error: "Contest not found" }, { status: 404 });
      }
      return Response.json(contest[0]);

    } else if (forSidebar) { // Optimized path for sidebar (lean data)
      const cacheKey = user ? `sidebar_contests_user_${user._id}` : 'sidebar_contests_public';
      try {
                const cachedData = await redis.get(cacheKey);
                if (cachedData) {
                    console.log(`Serving sidebar_contests for ${user?._id || 'public'} from Redis cache`);
                    return Response.json(JSON.parse(cachedData));
                }
            } catch (redisError) {
                console.error("Redis GET error for sidebar_contests:", redisError);
                // Don't fail the request if Redis GET fails, proceed to DB
            }
      const contests = await ContestModel.find(
        { ispublished: true }, // Only fetch published contests
        {
          _id: 1,
          title: 1,
          startTime: 1,
          endTime: 1,
          ispublished: 1,
          participants: user ? 1 : 0, // Conditionally fetch participants array (ObjectIDs) if user is logged in
        }
      ).lean(); // Use .lean() for plain JavaScript objects, much faster for reads

      // Transform contests to include `isRegistered` flag and remove raw `participants` array
      const contestsForSidebar = contests.map(c => ({
        _id: c._id,
        title: c.title,
        startTime: c.startTime,
        endTime: c.endTime,
        ispublished: c.ispublished,
        isRegistered: user ? c.participants?.some(pId => pId.toString() === user._id) : false,
        // Do NOT send the raw `participants` array to the frontend for the sidebar
      }));
      try {
                await redis.setex(cacheKey, SIDEBAR_CONTESTS_TTL, JSON.stringify(contestsForSidebar));
                console.log(`Cached sidebar_contests for ${user?._id || 'public'} in Redis`);
            } catch (redisError) {
                console.error("Redis SETEX error for sidebar_contests:", redisError);
                // Don't fail the request if Redis SET fails
            }
      return Response.json(contestsForSidebar);

    } else { // Fetch all contests (for full contests page, needs more details than sidebar but less than single contest)
      // This path should also be optimized if not all details are needed for a typical list view.
      // For now, keep the existing aggregation, but consider if it's truly optimal for a list.
      // For example, problem descriptions and full participant lists might not be needed.
      const contests = await ContestModel.aggregate([
        {
          $lookup: {
            from: "problems",
            localField: "problems",
            foreignField: "_id",
            as: "problems",
            pipeline: [{ $project: { _id: 1, title: 1 } }] // Only title for problems in list view
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
            pipeline: [{ $project: { _id: 1, username: 1 } }] // Only username for participants in list view
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdby",
            foreignField: "_id",
            as: "createdby",
            pipeline: [{ $project: { _id: 1, username: 1 } }]
          },
        },
        { $unwind: { path: "$createdby", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                participantsCount: { $size: "$participants" },
                isRegistered: user ? { $in: [new mongoose.Types.ObjectId(user._id), "$participants._id"] } : false
            },
        },
        {
            $project: {
                "problems.description": 0,
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
          title:data.title,
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