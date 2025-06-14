'use client';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { useDebounceCallback } from 'usehooks-ts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import {
   Form,
   FormControl,
   FormDescription,
   FormField,
   FormItem,
   FormLabel,
   FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signUpSchema } from '@/backend/schemas/Schemas';
import { Loader2 } from 'lucide-react';
type ErrorResponse = {
   message: string;
 };
function page() {
   const [username, setUsername] = useState('');
   const [usernameMessage, setUsernameMessage] = useState('');
   const [isCheckingUsername, setIsCheckingUsername] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const debounced = useDebounceCallback(setUsername, 300);
   const router = useRouter();

   const form = useForm<z.infer<typeof signUpSchema>>({
      resolver: zodResolver(signUpSchema),
      defaultValues: {
         username: '',
         email: '',
         password: '',
      },
   });

   useEffect(() => {
      const checkUsernameUnique = async () => {
         if (username.length > 0) {
            setIsCheckingUsername(true);
            try {
               const response = await axios.get('/api/check-username-unique', {
                  params: { username },
               });
               setUsernameMessage(response.data.message);
            } catch (error) {
               const axiosError = error as AxiosError<ErrorResponse>;
               setUsernameMessage(
                  axiosError.response?.data.message ?? 'Error checking username'
               );
            } finally {
               setIsCheckingUsername(false);
            }
         }
      };
      checkUsernameUnique();
   }, [username]);

   const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
      setIsSubmitting(true);
      try {
         const response = await axios.post('/api/sign-up', data);
         toast('Success', { description: response.data.message });
         router.replace(`/profile/${username}`);
         setIsSubmitting(false);
      } catch (error) {
         console.error('Error signing up', error);
         toast('Error signing up', {
            description : (error as AxiosError<ErrorResponse>).response?.data
               .message,
         });
         setIsSubmitting(false);
      }
   };

   return (
      <div className='flex justify-center items-center min-h-screen bg-background'>
         <div className='w-full max-w-md p-8 space-y-0 bg-card rounded-lg shadow-md border border-border'>
            <div className='text-center'>
               <h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 text-foreground'>
                  Join JEEForces
               </h1>
               <p className='mb-4 text-muted-foreground'>Sign up to start your JEEForces adventure</p>
            </div>
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='space-y-6'
               >
                  <FormField
                     control={form.control}
                     name='username'
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-foreground">Username</FormLabel>
                           <FormControl>
                              <Input
                                 placeholder='username'
                                 {...field}
                                 className="bg-background text-foreground border-border"
                                 onChange={(e) => {
                                    field.onChange(e);
                                    debounced(e.target.value);
                                 }}
                              />
                           </FormControl>
                           {isCheckingUsername && (
                              <Loader2 className='animate-spin' />
                           )}
                           {!isCheckingUsername && usernameMessage && (
                              <p
                                 className={`text-sm ${
                                    usernameMessage === 'Username is unique'
                                       ? 'text-green-500'
                                       : 'text-red-500'
                                 }`}
                              >
                                 {usernameMessage}
                              </p>
                           )}
                           {/* <FormDescription>
                              This is your public display name.
                           </FormDescription> */}
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <FormField
                     control={form.control}
                     name='email'
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-foreground">Email</FormLabel>
                           <FormControl>
                              <Input placeholder='email' {...field} className="bg-background text-foreground border-border" />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <FormField
                     control={form.control}
                     name='password'
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel className="text-foreground">Password</FormLabel>
                           <FormControl>
                              <Input
                                 type='password'
                                 placeholder='password'
                                 {...field}
                                 className="bg-background text-foreground border-border"
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />
                  <Button type='submit' disabled={isSubmitting} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                     {isSubmitting ? (
                        <>
                           <Loader2 className='mr-2 h-4 w-4 animate-spin' />{' '}
                           Please wait
                        </>
                     ) : (
                        'Sign Up'
                     )}
                  </Button>
               </form>
            </Form>
            <div className='text-center mt-4'>
               <p className="text-muted-foreground">
                  Already a member?{' '}
                  <Link
                     href='/sign-in'
                     className='text-primary hover:text-primary/80'
                  >
                     Sign in
                  </Link>
               </p>
            </div>
         </div>
      </div>
   );
}

export default page;