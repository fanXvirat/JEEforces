"use client";
import { CldUploadButton } from 'next-cloudinary';
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSettingsForm {
  avatar: string; // This will mainly hold the initial value, avatarUrl state is the source of truth after upload
  institute: string;
  yearofstudy: number;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

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

// Type for the data structure expected by the API for profile updates
interface ProfileUpdatePayload {
  avatar?: string;
  institute?: string;
  yearofstudy?: number;
}

// Type for the data structure expected by the API for password updates
interface PasswordUpdatePayload {
  oldPassword?: string;
  newPassword?: string;
}


export default function SettingsPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string>(""); // Store initial avatar
  const [debugStatus, setDebugStatus] = useState<string>("Initial state");

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "jee_forces_avatars";

  const form = useForm<UserSettingsForm>({
    // Set sensible initial defaults, they will be overwritten by useEffect
    defaultValues: {
      avatar: "",
      institute: "",
      yearofstudy: 1, // Or perhaps null/undefined if your API handles it
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { handleSubmit, control, register, setValue, reset, formState: { isDirty, dirtyFields } } = form;

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true); // Indicate loading while fetching
      setDebugStatus("Loading user data...");
      try {
        const response = await axios.get("/api/user");
        const userData = response.data;

        console.log("Loaded user data:", userData);
        setDebugStatus("User data loaded");

        // Update form defaults with fetched data
        reset({
          avatar: userData.avatar || "",
          institute: userData.institute || "",
          yearofstudy: userData.yearofstudy || 1, // Use fetched value or default
          oldPassword: "", // Keep passwords empty initially
          newPassword: "",
          confirmPassword: "",
        });

        // Update avatar preview state separately
        if (userData.avatar) {
          setAvatarUrl(userData.avatar);
          setInitialAvatarUrl(userData.avatar); // Store the initial avatar URL
          setDebugStatus(`Loaded avatar: ${userData.avatar}`);
        } else {
           setAvatarUrl("");
           setInitialAvatarUrl("");
        }

      } catch (error) {
        console.error("Failed to load user data", error);
        setDebugStatus("Failed to load user data");
        toast.error("Failed to load your profile information.");
      } finally {
        setIsLoading(false); // Stop loading indicator
      }
    };

    if (session?.user?.id) {
      loadUserData();
    }
  // reset should be included in dependency array if used inside useEffect
  // session?.user?.id is sufficient as reset is stable
  }, [session?.user?.id, reset]);

  const handleUploadResult = (result: CloudinaryResult) => {
    document.body.style.overflow = 'auto';
    console.log("Cloudinary upload result:", result);
    setDebugStatus(`Upload callback received: ${JSON.stringify(result).substring(0, 100)}...`);

    if (result.event === "success" && result.info) {
      const newAvatarUrl = result.info.secure_url || result.info.url;

      if (newAvatarUrl) {
        console.log("New Avatar URL:", newAvatarUrl);
        setAvatarUrl(newAvatarUrl);
        // Update the form value *as well* to mark the field as dirty if needed,
        // though we primarily rely on avatarUrl state for the actual value.
        setValue("avatar", newAvatarUrl, { shouldDirty: true });
        setDebugStatus(`Avatar uploaded: ${newAvatarUrl}`);
        toast.success("Avatar uploaded successfully! Save changes to apply.");
      } else {
        setDebugStatus("Upload success but no URL found in result");
        toast.error("Upload completed but image URL not found");
      }
    } else if (result.error) {
      setDebugStatus(`Upload error: ${result.error.message || "Unknown error"}`);
      toast.error("Upload failed: " + (result.error.message || "Unknown error"));
    } else {
      setDebugStatus(`Upload callback with event: ${result.event || "unknown"}`);
    }
  };

  const onSubmit = async (data: UserSettingsForm) => {
    setIsLoading(true);
    setDebugStatus("Processing form submission...");

    // --- Profile Information Update ---
    const profilePayload: ProfileUpdatePayload = {};

    // Only include avatar if it has actually changed from the initial load
    if (avatarUrl !== initialAvatarUrl) {
        profilePayload.avatar = avatarUrl; // Send the current URL (could be "" if removed)
        console.log("Avatar changed, adding to payload:", profilePayload.avatar);
    }

    // Only include institute if the field was modified by the user
    // `dirtyFields` from react-hook-form tells us if the user interacted with the field
    if (dirtyFields.institute) {
        profilePayload.institute = data.institute;
        console.log("Institute changed, adding to payload:", profilePayload.institute);
    }

    // Only include yearofstudy if the field was modified
    if (dirtyFields.yearofstudy) {
        // Ensure it's a number before sending
        const year = parseInt(String(data.yearofstudy), 10);
        if (!isNaN(year) && year >= 1) {
            profilePayload.yearofstudy = year;
            console.log("Year of study changed, adding to payload:", profilePayload.yearofstudy);
        } else {
             console.warn("Year of study changed but value is invalid, not sending.");
             // Optionally show a toast message here
        }
    }

    let profileUpdateSuccess = false;
    if (Object.keys(profilePayload).length > 0) {
      setDebugStatus(`Updating profile with: ${JSON.stringify(profilePayload)}`);
      try {
        const response = await axios.put("/api/user", profilePayload);
        console.log("Profile update API response:", response.data);
        setDebugStatus(`Profile updated successfully.`);
        toast.success("Profile information updated!");
        // Update the initial avatar URL if it was changed successfully
        if (profilePayload.avatar !== undefined) {
            setInitialAvatarUrl(profilePayload.avatar);
        }
        // Reset dirty state for successfully updated fields
        reset(data, { keepValues: true, keepDirty: false, keepDefaultValues: false }); // Resets dirty state but keeps current values
        profileUpdateSuccess = true;
      } catch (error) {
        const err = error as AxiosError<{ error: string }>;
        console.error("Profile update error:", err);
        setDebugStatus(`Profile update error: ${err.response?.data.error || "Unknown error"}`);
        toast.error(`Profile Update Failed: ${err.response?.data.error || "Please try again"}`);
      }
    } else {
        console.log("No profile fields changed.");
        setDebugStatus("No profile fields to update.");
        profileUpdateSuccess = true; // Consider it success if nothing needed changing
    }

    // --- Password Change ---
    let passwordUpdateSuccess = false;
    if (data.oldPassword && data.newPassword) {
      if (data.newPassword !== data.confirmPassword) {
        toast.error("New passwords do not match!");
        // Don't set isLoading false here yet, maybe profile update is still pending or failed
      } else {
        setDebugStatus("Attempting password change...");
        const passwordPayload: PasswordUpdatePayload = {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        };
        try {
          // Assuming password change is handled by the same endpoint or a specific one
          // Adjust endpoint if necessary (e.g., /api/user/password)
          await axios.put(
            `/api/user/password`, // Changed endpoint for clarity, adjust if needed
            passwordPayload
          );
          toast.success("Password changed successfully!");
          setDebugStatus("Password changed successfully.");
          // Clear password fields on success
          setValue("oldPassword", "", { shouldDirty: false });
          setValue("newPassword", "", { shouldDirty: false });
          setValue("confirmPassword", "", { shouldDirty: false });
          passwordUpdateSuccess = true;
        } catch (error) {
          const err = error as AxiosError<{ error: string }>;
          console.error("Password change error:", err);
          setDebugStatus(`Password change error: ${err.response?.data.error || "Unknown error"}`);
          toast.error(`Password Change Failed: ${err.response?.data.error || "Check old password"}`);
        }
      }
    } else {
        // If only one password field is filled, maybe warn the user
        if (data.oldPassword || data.newPassword || data.confirmPassword) {
             console.log("Password fields incomplete, not attempting change.");
             toast.info("Please provide Old Password, New Password, and Confirmation to change password.");
        } else {
            console.log("No password change requested.");
            passwordUpdateSuccess = true; // Consider it success if no change was requested
        }
    }


    // --- Finalize ---
    // Only set loading false after all operations attempt
    setIsLoading(false);
    if (profileUpdateSuccess && passwordUpdateSuccess) {
       setDebugStatus("Form processing complete.");
       // Optionally: if you want to reset the entire form's dirty state after successful updates
       // reset({}, { keepValues: true }); // Resets dirty state but keeps current displayed values
    } else {
        setDebugStatus("Form processing completed with errors.");
    }
  };


  return (
    <div className="max-w-lg mx-auto mt-8 p-4"> {/* Added padding */}
      {/* Debug Status Display - Remove for production */}
      {/* <div className="mb-4 p-2 bg-gray-100 border rounded text-sm text-gray-600">
         Debug: {debugStatus} | Dirty Fields: {JSON.stringify(dirtyFields)} | Avatar State: {avatarUrl} | Initial Avatar: {initialAvatarUrl}
      </div> */}
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Avatar Upload */}
              <FormField
                control={control}
                name="avatar" // Keep this for react-hook-form structure
                render={({ field }) => ( // field is registered but we primarily use avatarUrl state
                  <FormItem>
                    <FormLabel>Avatar</FormLabel>

                    <div className="flex items-center gap-4">
                        {/* Avatar Preview */}
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar Preview"
                            className="w-16 h-16 rounded-full object-cover border" // Added border
                          />
                        ) : (
                           <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                No Avatar
                           </div>
                        )}

                        {/* Upload Button */}
                        <CldUploadButton
                          // Pass necessary props to CldUploadButton
                          uploadPreset={uploadPreset}
                           options={{
                              folder: 'jee_forces/avatars',
                              publicId: `user-${session?.user?.id || 'unknown'}-${Date.now()}`,
                              maxFiles: 1,
                              cropping: true, // Example: enable cropping
                              sources: ['local', 'url', 'camera'], // Example sources
                           }}
                          onSuccess={(result: any) => {
                            console.log("Success callback triggered", result);
                            setDebugStatus("onSuccess triggered");
                            handleUploadResult(result);
                          }}
                          onError={(error: any) => {
                            console.error("Upload error:", error);
                            setDebugStatus(`Upload error: ${JSON.stringify(error)}`);
                            toast.error(`Upload failed: ${error?.message || 'Unknown error'}`);
                          }}
                          className='outline outline-1 outline-gray-300 rounded-md hover:outline-gray-400 transition duration-200 ease-in-out'
                        >
                          {/* Style the button using a standard Button component */}
                          
                             {avatarUrl ? "Change Avatar" : "Upload Avatar"}
                          
                        </CldUploadButton>
                     </div>

                    {/* We don't need the hidden input if we manage avatarUrl separately
                        and add it to payload conditionally in onSubmit */}
                    {/* <input type="hidden" {...field} value={avatarUrl} /> */}

                    <FormMessage />
                  </FormItem>
                )}
              />


              {/* Institute */}
              <FormField
                control={control}
                name="institute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute</FormLabel>
                    <Input placeholder="Enter institute name" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Year of Study */}
              <FormField
                control={control}
                name="yearofstudy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year of Study</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      placeholder="Enter year"
                      {...field}
                      // Ensure value is stored as number
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10) || '')} // Pass empty string if parsing fails initially
                      // RHF handles converting it back for the 'number' type in the schema
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

               {/* Password Section - Wrap in a Card or add divider for clarity */}
               <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Change Password</h3>
                   {/* Old Password */}
                  <FormField
                    control={control}
                    name="oldPassword"
                    render={({ field }) => (
                      <FormItem className="mb-4"> {/* Added margin bottom */}
                        <FormLabel>Old Password</FormLabel>
                        <Input type="password" placeholder="Enter current password" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* New Password */}
                  <FormField
                    control={control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem className="mb-4"> {/* Added margin bottom */}
                        <FormLabel>New Password</FormLabel>
                        <Input type="password" placeholder="Enter new password" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>


              <Button type="submit" disabled={isLoading || !isDirty && avatarUrl === initialAvatarUrl} className="w-full">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              {!isDirty && avatarUrl === initialAvatarUrl && <p className="text-sm text-center text-gray-500 mt-2">No changes detected.</p>}
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* Add more debug info if needed */}
      {/* <pre className="mt-4 text-xs bg-gray-50 p-2 overflow-auto">
        Form State: {JSON.stringify(form.formState, null, 2)}
      </pre> */}
    </div>
  );
}