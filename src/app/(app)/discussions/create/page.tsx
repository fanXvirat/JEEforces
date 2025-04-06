'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

// Make sure this matches your schema
const createDiscussionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(20, 'Content must be at least 20 characters'),
});

export default function CreateDiscussionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createDiscussionSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      // Verify session exists and user is authenticated
      if (!session?.user) {
        throw new Error('Unauthorized');
      }

      const response = await axios.post('/api/discussions', {
        title: data.title,
        content: data.content,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 201) {
        toast.success('Discussion created successfully!');
        router.push(`/discussions/${response.data.discussion._id}`);
      } else {
        throw new Error(response.data?.error || 'Failed to create discussion');
      }
    } catch (error: any) {
      console.error('Creation error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to create discussion');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-4 text-center">
        Please sign in to create a discussion
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Discussion</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="title" className="block mb-2 text-sm font-medium">
            Title
          </label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Discussion title"
            className={errors.title ? 'border-red-500' : ''}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{typeof errors.title?.message === 'string' ? errors.title.message : ''}</p>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block mb-2 text-sm font-medium">
            Content
          </label>
          <Textarea
            id="content"
            {...register('content')}
            placeholder="Discussion content"
            rows={10}
            className={errors.content ? 'border-red-500' : ''}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-500">{typeof errors.content?.message === 'string' ? errors.content.message : ''}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Discussion'
          )}
        </Button>
      </form>
    </div>
  );
}