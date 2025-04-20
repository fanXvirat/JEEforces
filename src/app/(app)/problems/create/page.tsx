'use client';
import { useSession } from 'next-auth/react'; // Ensure this import is present
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, ImagePlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { CldUploadButton } from 'next-cloudinary';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';


interface CloudinaryResult {
  event?: string;
  info?: { secure_url?: string; url?: string; };
  error?: { message?: string; };
}

export default function ProblemFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('id');
  const { data: session, status } = useSession(); // <-- FIX: Destructure status
  const [loading, setLoading] = useState(!!problemId); // Initial loading state if editing
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 1,
    score: 10,
    tags: [] as string[],
    subject: 'Physics',
    options: ['', '', '', ''],
    correctOption: '',
    solution: '',
    imageUrl: null as string | null,
  });
  const [newTag, setNewTag] = useState('');

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  useEffect(() => {
    if (problemId) {
      const fetchProblem = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get(`/api/problems/${problemId}`);
          setFormData({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            score: data.score,
            tags: data.tags || [],
            subject: data.subject,
            options: data.options || ['', '', '', ''], // Ensure options array exists
            correctOption: data.correctOption || '',
            solution: data.solution || '',
            imageUrl: data.imageUrl || null,
          });
          if (data.imageUrl) {
            setImageUrl(data.imageUrl);
          }
        } catch (error) {
          console.error('Error fetching problem:', error);
          toast.error("Failed to load problem data.");
        } finally {
          setLoading(false);
        }
      };
      fetchProblem();
    } else {
        setLoading(false); // Not editing, finished initial setup
    }
  }, [problemId]);

  const handleUploadResult = (result: CloudinaryResult) => {
    document.body.style.overflow = 'auto';
    if (result.event === "success" && result.info) {
      const newImageUrl = result.info.secure_url || result.info.url;
      if (newImageUrl) {
        setImageUrl(newImageUrl);
        setFormData(prevFormData => ({ // Use functional update
            ...prevFormData,
            imageUrl: newImageUrl
        }));
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Upload completed but image URL not found");
      }
    } else if (result.error) {
      toast.error(`Upload failed: ${result.error.message || "Unknown error"}`);
    }
  };

  const removeImage = () => {
    setImageUrl(null);
    setFormData(prevFormData => ({ // Use functional update
        ...prevFormData,
        imageUrl: null
    }));
  };

  // --- Authorization Check ---
   if (status === 'loading') { // Now status is defined
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;
   }
   if (!session || session.user.role !== 'admin') {
     return (
       <div className="flex flex-col justify-center items-center h-screen">
         <p className="text-red-500 text-xl mb-4">Unauthorized Access</p>
         <Link href="/">
            <Button variant="outline">Go to Homepage</Button>
         </Link>
       </div>
     );
   }


  const handleSubmit = async (e: React.FormEvent) => {
     // ... (handleSubmit remains the same - using functional updates inside is good practice too if needed)
    e.preventDefault();
    setSubmitting(true);

    if (formData.options.some(opt => opt.trim() !== '') && !formData.correctOption) {
        toast.error("Please select the correct answer among the options provided.");
        setSubmitting(false);
        return;
    }

    const payload = {
      ...formData, // formData already includes the latest imageUrl due to functional updates
    };

    try {
      if (problemId) {
        await axios.put(`/api/problems/${problemId}`, payload);
        toast.success("Problem updated successfully!");
      } else {
        await axios.post('/api/problems', payload);
        toast.success("Problem created successfully!");
      }
      router.push('/problems');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving problem:', error);
      const errMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Unknown error';
      toast.error(`Error saving problem: ${errMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ... (addTag, removeTag remain the same)
    const addTag = () => {
        if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
        setFormData(prev => ({ // Functional update
            ...prev,
            tags: [...prev.tags, newTag.trim()],
        }));
        setNewTag('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ // Functional update
        ...prev,
        tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
    };


  // --- Loading State Check ---
  // This check should happen *after* the authorization check
  // Loading state is relevant mainly when editing (problemId exists)
  if (loading && problemId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // --- Render Form ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/problems" className="inline-flex items-center mb-6 text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Problems
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        {problemId ? 'Edit Problem' : 'Create New Problem'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 md:p-8 rounded-lg shadow-md border border-gray-200">

        {/* Title */}
        <div className="space-y-2">
            <Label htmlFor="title" className="text-lg font-medium">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              placeholder="Concise problem title (e.g., Kinematics - Projectile Motion)"
              className="text-base"
            />
        </div>

        {/* Description */}
        <div className="space-y-2">
            <Label htmlFor="description" className="text-lg font-medium">Problem Statement</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={6}
              placeholder="Clearly describe the problem. Use Markdown if needed for formatting (e.g., exponents, formulas)."
              required
              className="text-base"
            />
        </div>


        {/* Image Upload Section (Updated Styling) */}
        <div className="space-y-3 border-t pt-6 min-h-[80px]"> {/* <-- Added min-h */}
           <Label className="text-lg font-medium">Problem Image (Optional)</Label>
           {imageUrl ? (
             <div className="relative group w-fit border rounded-md overflow-hidden shadow-sm">
               <img src={imageUrl} alt="Problem visualization" className="max-w-sm max-h-64 object-contain rounded-md bg-gray-50 p-1" />
               <button
                 type="button"
                 onClick={removeImage}
                 className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-1"
                 aria-label="Remove image"
               >
                 <XCircle size={20} />
               </button>
             </div>
           ) : (
             <div className="flex items-center">
               {uploadPreset ? (
                 <CldUploadButton
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                    options={{
                       folder: 'jee_problems',
                       maxFiles: 1,
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
                     <ImagePlus size={18} /> Upload Image
                 </CldUploadButton>
               ) : (
                 <p className="text-sm text-red-600">Image upload configuration missing. Check environment variables.</p>
               )}
             </div>
           )}
         </div>


        {/* Difficulty, Subject, Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6">
            {/* ... fields remain same */}
            <div className="space-y-2">
                <Label htmlFor="difficulty" className="font-medium">Difficulty</Label>
                <Select
                value={formData.difficulty.toString()}
                onValueChange={(value) => setFormData({...formData, difficulty: parseInt(value)})}
                >
                <SelectTrigger id="difficulty">
                    <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="1">Easy</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Hard</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="subject" className="font-medium">Subject</Label>
                <Select
                value={formData.subject}
                onValueChange={(value) => setFormData({...formData, subject: value})}
                >
                <SelectTrigger id="subject">
                    <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="score" className="font-medium">Score</Label>
                <Input
                id="score"
                type="number"
                min="1"
                value={formData.score}
                onChange={(e) => setFormData({...formData, score: parseInt(e.target.value) || 0})}
                required
                className="text-base"
                />
            </div>
        </div>

        {/* Tags */}
        <div className="space-y-2 border-t pt-6">
             {/* ... fields remain same */}
            <Label htmlFor="tags-input" className="font-medium">Tags</Label>
            <div className="flex gap-2">
                <Input
                id="tags-input"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="e.g., Kinematics, Calculus"
                className="flex-grow"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                    }
                }}
                />
                <Button type="button" onClick={addTag} variant="secondary">
                Add Tag
                </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3 min-h-[24px]">
                {formData.tags.map((tag) => (
                <Badge
                    key={tag}
                    variant="secondary"
                    className="text-sm cursor-pointer hover:bg-red-100 hover:text-red-700"
                    onClick={() => removeTag(tag)}
                >
                    {tag} <XCircle className="ml-1 h-3 w-3" />
                </Badge>
                ))}
            </div>
        </div>

        {/* Options */}
        <div className="space-y-3 border-t pt-6">
            {/* ... fields remain same - logic should be ok now */}
            <Label className="text-lg font-medium">Options (Select correct answer)</Label>
            {formData.options.map((option, index) => (
                <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md border">
                <input
                    type="radio"
                    id={`option-${index}`}
                    name="correctOptionRadio"
                    value={option}
                    checked={formData.correctOption === option && option.trim() !== ''}
                    onChange={(e) => {
                        setFormData({...formData, correctOption: option })
                    }}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                    disabled={option.trim() === ''}
                />
                <Label htmlFor={`option-${index}`} className="font-semibold text-gray-700 mr-1 w-6 text-center">{String.fromCharCode(65 + index)}</Label>
                <Input
                    value={option}
                    onChange={(e) => {
                    const newOptions = [...formData.options];
                    const newValue = e.target.value;
                    const oldOptionValue = newOptions[index];
                    newOptions[index] = newValue;

                    if (formData.correctOption === oldOptionValue && newValue.trim() !== '') {
                        setFormData({...formData, options: newOptions, correctOption: newValue });
                    }
                    else if (formData.correctOption === oldOptionValue && newValue.trim() === '') {
                        setFormData({...formData, options: newOptions, correctOption: '' });
                    }
                    else {
                        setFormData({...formData, options: newOptions});
                    }
                    }}
                    placeholder={`Text for Option ${String.fromCharCode(65 + index)}`}
                    required
                    className="flex-grow text-base"
                />
                </div>
            ))}
            {formData.options.some(opt => opt.trim() !== '') && !formData.correctOption && (
                <p className="text-sm text-red-600 pt-1">Please select one of the options as the correct answer by clicking the radio button next to it.</p>
            )}
        </div>

        {/* Solution */}
        <div className="space-y-2 border-t pt-6">
            {/* ... fields remain same */}
            <Label htmlFor="solution" className="text-lg font-medium">Solution (Optional)</Label>
            <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({...formData, solution: e.target.value})}
                rows={4}
                placeholder="Explain the steps to arrive at the correct answer. Markdown supported."
                className="text-base"
            />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t mt-4">
            {/* ... fields remain same */}
             <Button type="submit" disabled={submitting || loading} size="lg">
                {submitting ? (
                <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Saving...
                </>
                ) : (problemId ? 'Update Problem' : 'Create Problem')}
            </Button>
        </div>
      </form>
    </div>
  );
}