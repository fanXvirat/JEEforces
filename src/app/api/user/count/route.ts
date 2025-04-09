
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";

export async function GET() {
  await dbConnect();
  
  try {
    const count = await UserModel.countDocuments();
    return Response.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}