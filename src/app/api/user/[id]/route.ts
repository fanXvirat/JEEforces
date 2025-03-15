import dbConnect from '@/lib/dbConnect';
import UserModel from '@/backend/models/User.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  await dbConnect();
  
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { oldPassword, newPassword } = await request.json();
  if (!oldPassword || !newPassword) {
    return Response.json({ error: 'Both fields are required' }, { status: 400 });
  }

  try {
    const user = await UserModel.findById(session.user._id).select('+password');
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if old password is correct
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return Response.json({ error: 'Incorrect old password' }, { status: 400 });
    }

    // Hash and update new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return Response.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
