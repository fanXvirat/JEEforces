"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select , SelectContent, SelectTrigger, SelectValue,SelectItem} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { use } from "react"; // ✅ Import use() to unwrap params

const profileUpdateSchema = z.object({
  avatar: z.string().url({ message: "Invalid avatar URL" }),
  institute: z.string().min(2, { message: "Institute name is required" }),
  yearofstudy: z
    .number()
    .min(1, { message: "Year of study must be at least 1" })
    .max(10, { message: "Year of study must be reasonable" }),
});

type ProfileUpdateType = z.infer<typeof profileUpdateSchema>;

export default function ProfileCompletionPage({ params }: { params: Promise<{ username: string }> }) {
  const resolvedParams = use(params); // ✅ Unwrapping params using use()
  const username = resolvedParams.username;
  
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const institutes = ["Physics Wallah","Allen Institue","Self","Vidya Mandir"];
  const form = useForm<ProfileUpdateType>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      avatar: "",
      institute: "",
      yearofstudy: 1,
    },
  });

  const onSubmit = async (data: ProfileUpdateType) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/update-profile", { username, ...data });
      toast("Profile Updated", { description: response.data.message });
      router.push("/dashboard"); // Redirect to dashboard after update
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast("Error", { description: axiosError.response?.data.message || "Something went wrong" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="avatar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-avatar.com/avatar.png" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="institute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institute Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger >
                      <SelectValue placeholder="Select your Institute"/>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {institutes.map((inst) => (
                      <SelectItem key={inst} value={inst}>
                      {inst}
                      </SelectItem>
                    ))}
                  </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="yearofstudy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year of Study</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
