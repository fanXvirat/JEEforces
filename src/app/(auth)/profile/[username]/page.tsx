"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react"; // Import use hook
import axios, { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CldUploadButton } from 'next-cloudinary';
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface CloudinaryResult {
  event?: string;
  info?: {
    secure_url?: string;
    public_id?: string;
    url?: string;
  };
  error?: {
    message?: string;
  };
}

const profileUpdateSchema = z.object({
  institute: z.string().min(1, { message: "Please select an institute" }),
  yearofstudy: z
    .number({ invalid_type_error: "Year must be a number" })
    .min(1, { message: "Year of study must be at least 1" })
    .max(14, { message: "Year of study seems too high" }),
});

type ProfileUpdateType = z.infer<typeof profileUpdateSchema>;

interface ProfileCompletionPageProps {
  params: Promise<{ username: string }>;
}

export default function ProfileCompletionPage({ params }: ProfileCompletionPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const unwrappedParams = use(params);
  const username = unwrappedParams.username;

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const institutes = ["Physics Wallah", "Allen Institute", "Self", "Vidya Mandir", "Other"];

  const form = useForm<ProfileUpdateType>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      institute: "",
      yearofstudy: 1,
    },
  });

  const handleUploadResult = (result: CloudinaryResult) => {
    if (result.event === "success" && result.info) {
      const newAvatarUrl = result.info.secure_url || result.info.url;
      if (newAvatarUrl) {
        setAvatarUrl(newAvatarUrl);
        toast.success("Avatar uploaded successfully!");
      }
    } else if (result.error) {
      toast.error("Upload failed: " + (result.error.message || "Unknown error"));
    }
  };

  const onSubmit = async (data: ProfileUpdateType) => {
    if (!avatarUrl) {
      toast.error("Please upload an avatar image.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username,
        ...data,
        avatar: avatarUrl,
        yearofstudy: Number(data.yearofstudy)
      };

      const response = await axios.post("/api/update-profile", payload);
      toast("Profile Updated", { description: response.data.message });
      router.push("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast("Error Updating Profile", {
        description: axiosError.response?.data.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background p-4">
      <div className="w-full max-w-lg p-6 md:p-8 bg-card rounded-xl shadow-lg border border-border">
        <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
          Welcome, {username}! Complete Your Profile
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Avatar Upload Section */}
            <FormItem>
              <FormLabel className="text-foreground">Avatar</FormLabel>
              <div className="flex items-center gap-4 mt-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-muted"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs border-2 border-muted">
                    No Avatar
                  </div>
                )}
                {uploadPreset ? (
                  <CldUploadButton
                    options={{
                      folder: 'user_avatars',
                      publicId: `user-${username || session?.user?.id || 'anon'}-${Date.now()}`,
                      maxFiles: 1,
                      cropping: true,
                      croppingAspectRatio: 1,
                      showSkipCropButton: false,
                    }}
                    uploadPreset={uploadPreset}
                    onSuccess={(result: any) => handleUploadResult(result)}
                    onError={(error: any) => {
                      console.error("Upload error:", error);
                      toast.error(`Upload failed: ${error?.message || 'Unknown error'}`);
                    }}
                    onClose={() => {
                      document.body.style.overflow = 'auto';
                    }}
                  >
                    {avatarUrl ? "Change Avatar" : "Upload Avatar"}
                  </CldUploadButton>
                ) : (
                  <p className="text-destructive text-sm">Upload configuration missing.</p>
                )}
              </div>
            </FormItem>

            {/* Institute Selection */}
            <FormField
              control={form.control}
              name="institute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Coaching Institute / School</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select your institute/preparation method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-background">
                      {institutes.map((inst) => (
                        <SelectItem key={inst} value={inst} className="hover:bg-muted">
                          {inst}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Year of Study Input */}
            <FormField
              control={form.control}
              name="yearofstudy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Current Year of Study</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="e.g., 1 for 11th, 2 for 12th..."
                      className="bg-background text-foreground"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        const num = parseInt(value, 10);
                        field.onChange(value === '' || isNaN(num) ? 0 : num);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : "Complete Profile"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}