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
import { useState } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
export default function SignInForm() {
   const router = useRouter();
   const [showResend, setShowResend] = useState(false);
   const [userEmail, setUserEmail] = useState('');
   const { executeRecaptcha } = useGoogleReCaptcha();
   const form = useForm<z.infer<typeof signInSchema>>({
      resolver: zodResolver(signInSchema),
      defaultValues: {
         email: '',
         password: '',
      },
   });

   const onSubmit = async (data: z.infer<typeof signInSchema>) => {

      if (!executeRecaptcha) {
         toast.error('CAPTCHA not ready. Please refresh the page and try again.');
         return;
      }
      const captchaToken = await executeRecaptcha('signin');

      // --- 4. Pass the token along with credentials ---
      const result = await signIn('credentials', {
         redirect: false,
         email: data.email,
         password: data.password,
         captchaToken, // Add token here
      });

      if (result?.error) {
         if (result.error === 'Please verify your email before signing in') {
            setShowResend(true);
            setUserEmail(data.email);
            toast('Account not verified', {
               description: 'Please verify your email to continue.',
            });
         } else if (result.error === 'CredentialsSignin' || result.error === 'Incorrect password' || result.error === 'No user found with this email') {
            toast('Login Failed', {
               description: 'Incorrect email or password.',
            });
         } else {
            // This will now catch our CAPTCHA error message
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
            {showResend && (
               <div className="text-center mt-4">
                  <Button
                     variant="outline"
                     onClick={async () => {
                        const res = await fetch('/api/sign-up/resend-verification', {
                           method: 'POST',
                           body: JSON.stringify({ email: userEmail }),
                           headers: { 'Content-Type': 'application/json' },
                        });

                        if (res.ok) {
                           toast('Verification email sent!', {
                              description: `Check your inbox for a new verification link.`,
                           });
                        } else {
                           const { message } = await res.json();
                           toast('Failed to resend email', {
                              description: message,
                           });
                        }
                     }}
                  >
                     Resend Verification Email
                  </Button>
               </div>
            )}
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
            <p className="px-8 pt-4 text-center text-xs text-muted-foreground border-t">
                    This site is protected by reCAPTCHA and the Google{" "}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                        Privacy Policy
                    </a> and{" "}
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                        Terms of Service
                    </a> apply.
                </p>
         </div>
      </div>
   );
}