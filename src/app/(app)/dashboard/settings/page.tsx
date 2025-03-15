"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSettingsForm {
  avatar: string;
  institute: string;
  yearofstudy: number;
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

const SettingsPage = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<UserSettingsForm>({
    defaultValues: {
      avatar: "",
      institute: "",
      yearofstudy: 1,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: UserSettingsForm) => {
    setIsLoading(true);
    
    try {
      const updateData = {
        avatar: values.avatar,
        institute: values.institute,
        yearofstudy: values.yearofstudy,
      };
      
      // Update Profile Data
      await axios.put("/api/user", updateData);
      toast.success("Profile updated successfully!");

      // Handle Password Change
      if (values.oldPassword && values.newPassword) {
        if (values.newPassword !== values.confirmPassword) {
          toast.error("New passwords do not match!");
          return;
        }
        await axios.put("/api/user/${session?.user?.id}", {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        });
        toast.success("Password changed successfully!");
      }
      
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      toast.error(axiosError.response?.data.error || "Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <Input placeholder="Enter avatar URL" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="institute"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institute</FormLabel>
                    <Input placeholder="Enter institute name" {...field} />
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
                    <Input type="number" min="1" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password Change Fields */}
              <FormField
                control={form.control}
                name="oldPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Old Password</FormLabel>
                    <Input type="password" placeholder="Enter old password" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <Input type="password" placeholder="Enter new password" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <Input type="password" placeholder="Confirm new password" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
