'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, setHours, setMinutes } from 'date-fns';

interface Problem {
  _id: string;
  title: string;
}

const CreateContestPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 60 * 60 * 1000), // Default to 1 hour from now
    problems: [] as string[],
  });

  const [problems, setProblems] = useState<Problem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);
  const [startHour, setStartHour] = useState('00');
  const [startMinute, setStartMinute] = useState('00');
  const [endHour, setEndHour] = useState('01');
  const [endMinute, setEndMinute] = useState('00');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const response = await axios.get('/api/problems');
        setProblems(response.data);
      } catch (error) {
        toast.error('Failed to load problems');
      }
    };
    fetchProblems();
  }, []);

  useEffect(() => {
    // Update the full datetime when hour or minute changes
    const updateTime = (field: 'startTime' | 'endTime', hours: string, minutes: string) => {
      const hoursNum = parseInt(hours, 10) || 0;
      const minutesNum = parseInt(minutes, 10) || 0;
      
      setFormData(prev => ({
        ...prev,
        [field]: setHours(setMinutes(new Date(prev[field]), minutesNum), hoursNum),
      }));
    };

    updateTime('startTime', startHour, startMinute);
    updateTime('endTime', endHour, endMinute);
  }, [startHour, startMinute, endHour, endMinute]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session || !session.user || session.user.role !== 'admin') {
      toast.error('Unauthorized');
      return;
    }

    if (formData.title.length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    if (formData.problems.length === 0) {
      toast.error('Please select at least one problem');
      return;
    }

    setIsLoading(true);
    try {
      const contestData = {
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime.toISOString(),
        endTime: formData.endTime.toISOString(),
        problems: formData.problems,
      };

      const response = await axios.post('/api/contests', contestData);

      if (response.status === 201) {
        toast.success('Contest created successfully!');
        router.push('/contests');
      } else {
        throw new Error(response.data?.message || 'Failed to create contest');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to create contest');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: Date | undefined, field: 'startTime' | 'endTime') => {
    if (!date) return;
    setFormData(prev => ({
      ...prev,
      [field]: setHours(setMinutes(date, prev[field].getMinutes()), prev[field].getHours()),
    }));
  };

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">Create New Contest</h1>

      <Card>
        <CardHeader>
          <CardTitle>Contest Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium">Title</label>
              <Input
                placeholder="Contest Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                minLength={5}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium">Description</label>
              <Textarea
                placeholder="Contest description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            {/* Time Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium">Start Time</label>
                <div className="flex gap-2">
                  <Popover open={startTimeOpen} onOpenChange={setStartTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        {format(formData.startTime, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={formData.startTime}
                        onSelect={(date) => handleDateChange(date, 'startTime')}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-1">
                    <Select
                      value={startHour.padStart(2, '0')}
                      onValueChange={(value) => setStartHour(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select
                      value={startMinute.padStart(2, '0')}
                      onValueChange={(value) => setStartMinute(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium">End Time</label>
                <div className="flex gap-2">
                  <Popover open={endTimeOpen} onOpenChange={setEndTimeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        {format(formData.endTime, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={formData.endTime}
                        onSelect={(date) => handleDateChange(date, 'endTime')}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-1">
                    <Select
                      value={endHour.padStart(2, '0')}
                      onValueChange={(value) => setEndHour(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span>:</span>
                    <Select
                      value={endMinute.padStart(2, '0')}
                      onValueChange={(value) => setEndMinute(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Problems Selection */}
            <div>
              <label className="block text-sm font-medium">Problems</label>
              <Select
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    problems: prev.problems.includes(value) ? prev.problems : [...prev.problems, value],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a problem" />
                </SelectTrigger>
                <SelectContent>
                  {problems.map((problem) => (
                    <SelectItem key={problem._id} value={problem._id}>
                      {problem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.problems.map((problemId) => {
                  const problem = problems.find((p) => p._id === problemId);
                  return (
                    <div key={problemId} className="bg-gray-100 px-2 py-1 rounded flex items-center">
                      <span>{problem?.title || 'Unknown'}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            problems: prev.problems.filter((id) => id !== problemId),
                          }))
                        }
                        className="text-red-500 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Create Contest'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateContestPage;