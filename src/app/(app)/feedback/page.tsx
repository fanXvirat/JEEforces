'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

function FeedbackFormComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reportedUserId = searchParams.get('reportedUserId'); // e.g., /feedback?reportedUserId=123

  const [type, setType] = useState(reportedUserId ? 'Report' : 'Feedback');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description,
          reportedUserId: reportedUserId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Thank you! Your feedback has been submitted.");
        router.push('/');
      } else {
        toast.error(data.error || "Failed to submit report.");
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Submit Feedback or Report a Concern</CardTitle>
        </CardHeader>
        <CardContent>
          {reportedUserId && <p className="mb-4 text-sm text-gray-600">You are reporting a specific user or their content.</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Type of Submission</Label>
              <Select onValueChange={setType} value={type}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Feedback">General Feedback</SelectItem>
                  <SelectItem value="Report">Report an Issue / User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide as much detail as possible..."
                required
                rows={8}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrap the component in Suspense because it uses useSearchParams
export default function FeedbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FeedbackFormComponent />
    </Suspense>
  );
}