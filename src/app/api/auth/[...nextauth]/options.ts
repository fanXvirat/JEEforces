import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/backend/models/User.model';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        await dbConnect();
        try {
          if (!credentials?.email || !credentials?.password) {
            throw new Error('Email and password are required');
          }

          // Find user by email or username
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.email },
              { username: credentials.email },
            ],
          }).select('+password'); // Ensure password is selected

          if (!user) {
            throw new Error('No user found with this email');
          }

          // Compare passwords
          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            throw new Error('Incorrect password');
          }

          // Return user object without the password
          return {
            id: user.id.toString(),
            _id: user.id.toString(),
            username: user.username,
            email: user.email,
            role: user.role,
          };
        } catch (err: any) {
          throw new Error(err.message || 'Failed to authenticate');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token._id = user._id; // Add user ID to the token
        token.username = user.username;
        token.role = user.role; // Add role to the token (if needed)
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token._id;
        session.user.username = token.username; // Add role to the session (if needed)
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET, // Ensure this is set in .env
  pages: {
    signIn: '/sign-in', // Custom sign-in page
  },
};