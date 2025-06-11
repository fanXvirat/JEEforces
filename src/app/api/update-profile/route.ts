import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, avatar, institute, yearofstudy } = await request.json();

    if (!username || !avatar || !institute || !yearofstudy) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    const user = await UserModel.findOneAndUpdate(
      { username },
      { avatar, institute, yearofstudy },
      { new: true }
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ message: "Profile updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating profile:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}