"use client";

import { useState, useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation"; // Removed useParams, using props instead
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
import { CldUploadButton } from 'next-cloudinary'; // Import Cloudinary button
import { useSession } from "next-auth/react"; // Import useSession if needed for publicId generation

// Define the Cloudinary upload result type (copy from SettingsPage)
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
  

  institute: z.string().min(1, { message: "Please select an institute" }), // Ensure selection
  yearofstudy: z
    .number({ invalid_type_error: "Year must be a number" }) // Better error message
    .min(1, { message: "Year of study must be at least 1" })
    .max(10, { message: "Year of study seems too high" }), // Adjusted message
});

// RHF type based on the schema
type ProfileUpdateType = z.infer<typeof profileUpdateSchema>;

// Component Props: Receive username directly
interface ProfileCompletionPageProps {
  params: { username: string };
}

export default function ProfileCompletionPage({ params }: ProfileCompletionPageProps) {
  const { username } = params; // Directly access username from props
  const { data: session } = useSession(); // Get session if needed for unique public_id

  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(""); // State for Cloudinary URL

  // Ensure Cloudinary preset is configured
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!uploadPreset) {
    console.error("ERROR: NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not defined in .env.local");
    // Optionally, show an error message to the user or disable upload
  }


  const institutes = ["Physics Wallah", "Allen Institute", "Self", "Vidya Mandir", "Other"]; // Added "Other"

  const form = useForm<ProfileUpdateType>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      // No default avatar URL input needed now
      institute: "",
      yearofstudy: 1, // Keep default year
    },
  });

  // --- Cloudinary Upload Handler (copy/adapt from SettingsPage) ---
  const handleUploadResult = (result: CloudinaryResult) => {
    console.log("Cloudinary upload result:", result);

    if (result.event === "success" && result.info) {
      const newAvatarUrl = result.info.secure_url || result.info.url;

      if (newAvatarUrl) {
        console.log("New Avatar URL:", newAvatarUrl);
        setAvatarUrl(newAvatarUrl); // Update state for preview
        // Optionally trigger form validation if avatar was part of schema
        // form.setValue('avatar', newAvatarUrl, { shouldValidate: true });
        toast.success("Avatar uploaded successfully!");
      } else {
        toast.error("Upload completed but image URL not found");
      }
    } else if (result.error) {
      toast.error("Upload failed: " + (result.error.message || "Unknown error"));
    }
  };


  const onSubmit = async (data: ProfileUpdateType) => {
     // **Crucial Check:** Ensure an avatar has been uploaded
     if (!avatarUrl) {
       toast.error("Please upload an avatar image.");
       return; // Stop submission if no avatar
     }

    setIsSubmitting(true);
    try {
      const payload = {
        username,
        ...data,
        avatar: avatarUrl, // Add the avatar URL from state to the payload
         // Ensure yearofstudy is sent as a number
        yearofstudy: Number(data.yearofstudy)
      };
      console.log("Submitting profile data:", payload); // Debug log

      const response = await axios.post("/api/update-profile", payload);
      toast("Profile Updated", { description: response.data.message || "Your profile is complete." });
      router.push("/dashboard"); // Redirect to dashboard after update
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      console.error("Profile update error:", error); // Log detailed error
      toast("Error Updating Profile", {
        description: axiosError.response?.data.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4"> {/* Added gradient bg and padding */}
      <div className="w-full max-w-lg p-6 md:p-8 bg-white rounded-xl shadow-xl"> {/* Increased size and rounded corners */}
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Welcome, {username}! Complete Your Profile
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6"> {/* Increased spacing */}

            {/* --- Avatar Upload Section --- */}
            <FormItem>
              <FormLabel>Avatar</FormLabel>
              <div className="flex items-center gap-4 mt-2">
                {/* Avatar Preview */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar Preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300" // Larger preview
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs border-2 border-gray-300">
                     No Avatar
                  </div>
                )}
                {/* Upload Button */}
                 {uploadPreset ? (
                    <CldUploadButton
                    options={{
                      folder: 'user_avatars', // Optional: specify a folder
                      // Generate a more unique public_id if possible
                      publicId: `user-${username || session?.user?.id || 'anon'}-${Date.now()}`,
                      maxFiles: 1,
                      cropping: true, // Enable cropping aspect ratio 1:1
                      croppingAspectRatio: 1,
                      showSkipCropButton: false,
                    }}
                    uploadPreset={uploadPreset} // Use the preset from env
                    onSuccess={(result: any) => handleUploadResult(result)}
                    onError={(error: any) => {
                      console.error("Upload error:", error);
                      toast.error(`Upload failed: ${error?.message || 'Unknown error'}`);
                    }}
                  >
                    {/* Use Shadcn Button for consistent styling */}
                    <Button type="button" variant="outline">
                      {avatarUrl ? "Change Avatar" : "Upload Avatar"}
                    </Button>
                  </CldUploadButton>
                 ) : (
                    <p className="text-red-600 text-sm">Upload configuration missing.</p>
                 )}

              </div>
               {/* Display error if avatar is missing on submit attempt, handled in onSubmit */}
            </FormItem>


            {/* --- Institute Selection --- */}
            <FormField
              control={form.control}
              name="institute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coaching Institute / School</FormLabel> {/* Clarified label */}
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your institute/preparation method" /> {/* Improved placeholder */}
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

            {/* --- Year of Study Input (Fixed) --- */}
            <FormField
              control={form.control}
              name="yearofstudy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Year of Study / Preparation</FormLabel> {/* Clarified label */}
                  <FormControl>
                     {/* Explicitly handle onChange to parse value */}
                    <Input
                      type="number"
                      min={1} // Basic browser validation
                      placeholder="e.g., 1 for 11th, 2 for 12th, 3 for Dropper" // Added placeholder
                      {...field} // Spread field props
                      value={field.value ?? ''} // Control the value, handle null/undefined
                      onChange={(e) => {
                        const value = e.target.value;
                        // Parse to integer or pass undefined if empty/invalid to let Zod handle
                        const num = value === '' ? undefined : parseInt(value, 10);
                        field.onChange(isNaN(num) ? undefined : num); // Pass number or undefined
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* --- Submission Button --- */}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                 // Add a simple loading spinner indicator
                 <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                 </div>
              ) : "Complete Profile"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}