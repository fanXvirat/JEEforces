'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import Link from 'next/link';
import { Loader2, ArrowLeft, Edit } from 'lucide-react';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import { Badge } from '@/components/ui/badge';

interface ProblemDetails {
  _id: string;
  title: string;
  description: string;
  difficulty: number;
  score: number;
  tags: string[];
  subject: string;
  options: string[];
  correctOption: string;
  solution: string;
  author: {
    username: string;
  };
}

export default function ProblemDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data } = await axios.get(`/api/problems/${id}`);
        setProblem(data);
      } catch (error) {
        console.error('Error fetching problem:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!problem) return <div>Problem not found</div>;

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-4xl">
      <Link href="/problems" className="flex items-center mb-6 text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Problems
      </Link>

      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{problem.title}</h1>
            <div className="flex items-center gap-2 mb-4">
              <DifficultyBadge difficulty={problem.difficulty} />
              <Badge variant="outline">{problem.subject}</Badge>
              <span className="text-sm text-gray-600">Score: {problem.score}</span>
            </div>
          </div>
          {session?.user?.role === 'admin' && (
            <Link href={`/problems/create?id=${id}`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>

        <div dangerouslySetInnerHTML={{ __html: problem.description }} />

        <div className="space-y-2">
          {problem.options.map((option, index) => (
            <div
              key={index}
              className={`p-4 border rounded cursor-pointer ${
                selectedOption === index ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => setSelectedOption(index)}
            >
              <div className="flex items-center">
                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                <span dangerouslySetInnerHTML={{ __html: option }} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowSolution(!showSolution)}
            variant={showSolution ? 'default' : 'outline'}
          >
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </Button>
        </div>

        {showSolution && (
          <div className="p-4 bg-gray-50 rounded">
            <h3 className="font-medium mb-2">Solution</h3>
            <div dangerouslySetInnerHTML={{ __html: problem.solution }} />
            <p className="mt-2 text-sm text-gray-600">
              Correct Answer: {String.fromCharCode(65 + parseInt(problem.correctOption))}
            </p>
          </div>
        )}

        <div className="text-sm text-gray-500">
          Created by: {problem.author.username}
        </div>
      </div>
    </div>
  );
}