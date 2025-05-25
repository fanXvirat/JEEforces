'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import {
   Form,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signInSchema } from '@/backend/schemas/Schemas';

export default function SignInForm() {
   const router = useRouter();

   const form = useForm<z.infer<typeof signInSchema>>({
      resolver: zodResolver(signInSchema),
      defaultValues: {
         email: '',
         password: '',
      },
   });

   const onSubmit = async (data: z.infer<typeof signInSchema>) => {
      const result = await signIn('credentials', {
         redirect: false,
         email: data.email,
         password: data.password,
      });

      if (result?.error) {
         if (result.error === 'CredentialsSignin') {
            toast('Login Failed', {
               description: 'Incorrect username or password',
            });
         } else {
            toast('Error', {
               description: result.error,
            });
         }
      }

      if (result?.url) {
         router.replace('/dashboard');
      }
   };

   return (
      <div className='flex justify-center items-center min-h-screen bg-background'>
         <div className='w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-md border border-border'>
            <div className='text-center'>
               <h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 text-foreground'>
                  Welcome Back to JEEForces
               </h1>
               <p className='mb-4'>
                  Sign in to continue your JEEforces journey
               </p>
            </div>
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
               >
                  <FormField
                     name='email'
                     control={form.control}
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-foreground">Email</FormLabel>
                           <Input {...field} className="bg-background text-foreground border-border"/>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <FormField
                     name='password'
                     control={form.control}
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-foreground">Password</FormLabel>
                           <Input type='password' {...field} className="bg-background text-foreground border-border"/>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <Button className='w-full bg-primary text-primary-foreground hover:bg-primary/90' type='submit'>
                     Sign In
                  </Button>
               </form>
            </Form>
            <div className='text-center mt-4'>
               <p className="text-muted-foreground">
                  Not a member yet?{' '}
                  <Link
                     href='/sign-up'
                     className='text-primary hover:text-primary/80'
                  >
                     Sign up
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
}