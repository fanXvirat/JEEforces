import { z } from 'zod';

// Username validation
export const usernameValidation = z.string()
  .min(3, 'Username too short')
  .max(20, 'Username too long')
  .regex(/^[a-zA-Z0-9_]*$/, 'Invalid username');

// Auth Schemas
export const signUpSchema = z.object({
  username: usernameValidation,
  email: z.string().email({ message: 'Invalid email' }),
  password: z.string().min(6, 'Password too short'),
});

export const signInSchema = z.object({
  email: z.string().min(1, 'Email/Username is required'), // Ensures a value is provided
  password: z.string().min(1, 'Password is required'), // Ensures a value is provided
});

export const profileUpdateSchema = z.object({
  username: usernameValidation.optional(),
  email: z.string().email({ message: 'Invalid email' }).optional(),
  profilePicture: z.string().url('Invalid URL').optional(),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(6, 'New password too short'),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Passwords do not match',
  path: ['confirmNewPassword'],
});

// Contest Schemas
export const createContestSchema = z.object({
  title: z.string().min(5, 'Title too short'),
  description: z.string().max(500, 'Description too long'),
  startTime: z.date(),
  endTime: z.date(),
  problems: z.array(z.string().min(1, 'Invalid problem ID')),
});

export const contestParticipationSchema = z.object({
  contestId: z.string().min(1, 'Invalid contest ID'),
  userId: z.string().min(1, 'Invalid user ID'),
});

// Problem Schemas
export const createProblemSchema = z.object({
    title: z.string().min(5, 'Title too short'),
    description: z.string().min(20, 'Description too short'),
    difficulty: z.number().positive(),
    tags: z.array(z.string()).optional(),
    options: z.array(z.string()).min(2, 'At least 2 options required'),
    correctOption: z.number().min(0).max(3),
    score: z.number().positive(),
  });

// Submission Schemas
export const submitSolutionSchema = z.object({
  problemId: z.string().min(1, 'Invalid problem ID'),
  userId: z.string().min(1, 'Invalid user ID'),
  selectedOption: z.number().min(0).max(3),
});

// Discussion & Comments Schemas
export const createDiscussionSchema = z.object({
  title: z.string().min(5, 'Title too short'),
  content: z.string().min(20, 'Content too short'),
  authorId: z.string().min(1, 'Invalid author ID'),
});

export const createCommentSchema = z.object({
  discussionId: z.string().min(1, 'Invalid discussion ID'),
  content: z.string().min(5, 'Comment too short'),
  authorId: z.string().min(1, 'Invalid author ID'),
});
