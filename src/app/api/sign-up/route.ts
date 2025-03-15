import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import bcrypt from "bcryptjs";
// import { sendVerificationEmail } from "@/helpers/sendVerificationEmail";  // Commented out for future use

export async function POST(request: Request) {
  await dbConnect();
  try {
    const { username, email, password } = await request.json();

    // Check if username already exists (No isVerified check for now)
    const existingUserByUsername = await UserModel.findOne({ username });

    if (existingUserByUsername) {
      return Response.json(
        { message: "Username already exists", success: false },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const existingUserByEmail = await UserModel.findOne({ email });
    if (existingUserByEmail) {
      return Response.json(
        { message: "Email already exists", success: false },
        { status: 400 }
      );
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Uncomment these lines when adding email verification
    /*
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1); // 1-hour expiry
    */

    // Create new user (without verification fields for now)
    const newUser = new UserModel({
      username,
      email,
      password: hashedPassword,
      // verifycode: Math.floor(100000 + Math.random() * 900000).toString(), // Uncomment when adding email verification
      // verifycodeexpiry: expiryDate,
      // isVerified: false, // Will be added later when email verification is implemented
    });

    await newUser.save();

    // Skip email verification for now (uncomment when implementing)
    /*
    const emailResponse = await sendVerificationEmail(username, email, newUser.verifycode);
    if (!emailResponse.success) {
      return Response.json(
        { message: "Error sending verification email", success: false },
        { status: 500 }
      );
    }
    */

    return Response.json(
      { message: "User registered successfully!", success: true },
      { status: 201 }
    );
  } catch (error) {
    console.log(error, "Error signing up");
    return Response.json(
      { message: "Error signing up", success: false },
      { status: 500 }
    );
  }
}
