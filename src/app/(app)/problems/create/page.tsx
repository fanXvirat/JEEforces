'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
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
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

export default function ProblemFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = searchParams.get('id');
  const { data: session } = useSession();
  const [loading, setLoading] = useState(!!problemId);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 1,
    score: 10,
    tags: [] as string[],
    subject: 'Physics',
    options: ['', '', '', ''],
    correctOption: 0,
    solution: '',
  });
  const [newTag, setNewTag] = useState('');

  // Fetch problem data when in edit mode
  useEffect(() => {
    if (problemId) {
      const fetchProblem = async () => {
        try {
          const { data } = await axios.get(`/api/problems/${problemId}`);
          setFormData({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            score: data.score,
            tags: data.tags || [],
            subject: data.subject,
            options: data.options,
            correctOption: parseInt(data.correctOption),
            solution: data.solution || '',
          });
        } catch (error) {
          console.error('Error fetching problem:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchProblem();
    }
  }, [problemId]);

  if (!session || session.user.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Unauthorized access</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (problemId) {
        // Update existing problem
        await axios.put(`/api/problems/${problemId}`, formData);
      } else {
        // Create new problem
        await axios.post('/api/problems', formData);
      }
      router.push('/problems');
      router.refresh();
    } catch (error) {
      console.error('Error saving problem:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-4xl">
      <Link href="/problems" className="flex items-center mb-6 text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Problems
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {problemId ? 'Edit Problem' : 'Create New Problem'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder="Enter problem title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Problem Statement</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={6}
            placeholder="Describe the problem in detail"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty.toString()}
              onValueChange={(value) => setFormData({...formData, difficulty: parseInt(value)})}
            >
              <SelectTrigger>
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
            <Label>Subject</Label>
            <Select
              value={formData.subject}
              onValueChange={(value) => setFormData({...formData, subject: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Physics">Physics</SelectItem>
                <SelectItem value="Chemistry">Chemistry</SelectItem>
                <SelectItem value="Mathematics">Mathematics</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Score</Label>
          <Input
            type="number"
            min="1"
            value={formData.score}
            onChange={(e) => setFormData({...formData, score: parseInt(e.target.value) || 0})}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
            />
            <Button type="button" onClick={addTag}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary" 
                className="cursor-pointer hover:bg-gray-200"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Options (Select correct answer)</Label>
          {formData.options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                type="radio"
                name="correctOption"
                checked={formData.correctOption === index}
                onChange={() => setFormData({...formData, correctOption: index})}
                className="h-4 w-4"
              />
              <Input
                value={option}
                onChange={(e) => {
                  const newOptions = [...formData.options];
                  newOptions[index] = e.target.value;
                  setFormData({...formData, options: newOptions});
                }}
                placeholder={`Option ${String.fromCharCode(65 + index)}`}
                required
              />
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Solution</Label>
          <Textarea
            value={formData.solution}
            onChange={(e) => setFormData({...formData, solution: e.target.value})}
            rows={4}
            placeholder="Explain the solution"
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || loading}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {problemId ? 'Update Problem' : 'Create Problem'}
          </Button>
        </div>
      </form>
    </div>
  );
}