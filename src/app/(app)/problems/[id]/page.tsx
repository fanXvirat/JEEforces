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
import Image from 'next/image'; // Import Image component for Next.js optimization

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
  imageUrl?: string;
}

export default function ProblemDetailPage() {
  const { id } = useParams();
  const { data: session, status: authStatus } = useSession();
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (id) {
      const fetchProblem = async () => {
        setLoading(true);
        try {
          const { data } = await axios.get(`/api/problems/${id}`);
          setProblem(data);
        } catch (error) {
          console.error('Error fetching problem:', error);
          setProblem(null);
        } finally {
          setLoading(false);
        }
      };
      fetchProblem();
    } else {
      setLoading(false);
    }
  }, [id]);

  const handleOptionSelect = (optionText: string) => {
      setSelectedOption(optionText);
      setIsCorrect(null);
      setShowSolution(false);
  };

  const checkAnswer = () => {
      if (selectedOption === null || !problem) return;
      const correct = selectedOption === problem.correctOption;
      setIsCorrect(correct);
      setShowSolution(true);
  };


  if (loading || authStatus === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-100px)]"> {/* Adjusted height for better centering */}
        <Loader2 className="h-12 w-12 animate-spin text-primary" /> {/* Use primary color for consistency */}
      </div>
    );
  }

  if (!problem) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 text-center"> {/* Added px-4 and text-center */}
            <p className="text-xl text-destructive mb-4">Problem not found or failed to load.</p>
            <Link href="/problems">
                <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Problems
                </Button>
            </Link>
        </div>
     )
  }

  const getOptionBorderColor = (optionText: string) => {
      if (selectedOption !== optionText) return 'border-border hover:border-muted-foreground/30';
      if (isCorrect === null) return 'border-ring bg-accent text-accent-foreground';
      if (isCorrect === true) return 'border-green-600 bg-green-900/20 text-green-600';
      if (isCorrect === false) return 'border-red-600 bg-red-900/20 text-red-600';
      return 'border-border';
  };


  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl"> {/* Adjusted padding for mobile */}
      <Link href="/problems" className="inline-flex items-center mb-6 text-primary hover:underline"> {/* Use primary color */}
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Problems
      </Link>

      <div className="bg-card text-card-foreground p-4 sm:p-6 md:p-8 rounded-lg shadow-md border border-border space-y-6"> {/* Adjusted padding */}
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-foreground leading-tight"> {/* Adjusted title size */}
                {problem.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <DifficultyBadge difficulty={problem.difficulty} />
              <Badge variant="outline">{problem.subject}</Badge>
              <Badge variant="secondary">Score: {problem.score}</Badge>
               {problem.tags && problem.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                     {problem.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                  </div>
               )}
            </div>
          </div>
          {session?.user?.role === 'admin' && (
            <Link href={`/problems/create?id=${problem._id}`} className="flex-shrink-0 mt-2 sm:mt-0 w-full sm:w-auto"> {/* Added w-full for mobile button */}
              <Button variant="outline" size="sm" className="w-full"> {/* Ensure button takes full width on mobile */}
                <Edit className="h-4 w-4 mr-2" />
                Edit Problem
              </Button>
            </Link>
          )}
        </div>

        {/* Problem Image Display Section */}
        {problem.imageUrl && (
          <div className="my-4 py-4 border-y flex justify-center">
            {/* Using Next.js Image component for optimization */}
            <Image
              src={problem.imageUrl}
              alt={`Problem illustration: ${problem.title}`}
              width={500} // Set a reasonable base width for image optimization
              height={300} // Set a reasonable base height for image optimization
              className="block max-w-full md:max-w-2xl w-auto h-auto max-h-[300px] sm:max-h-[500px] object-contain rounded-md bg-muted/40 p-1 border shadow-sm" // Responsive max-height
              loading="lazy"
            />
          </div>
        )}

        {/* Problem Description */}
        <div
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground" // Added dark:prose-invert for dark mode compatibility
            dangerouslySetInnerHTML={{ __html: problem.description }}
        />

        {/* Options Section */}
        <div className="space-y-3 pt-4">
           <h2 className="text-lg font-semibold text-foreground">Options</h2>
          {problem.options.map((option, index) => (
            <div
              key={index}
              className={`p-3 border rounded-md cursor-pointer transition-colors duration-150 text-sm ${getOptionBorderColor(option)}`} 
              onClick={() => handleOptionSelect(option)}
              role="radio"
              aria-checked={selectedOption === option}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleOptionSelect(option)}
            >
              <div className="flex items-start sm:items-center">
                <span className="font-semibold mr-3 text-muted-foreground">{String.fromCharCode(65 + index)}.</span>
                <span dangerouslySetInnerHTML={{ __html: option }} />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-4 w-full"> {/* Added w-full to make buttons take full width */}
          <Button
             onClick={checkAnswer}
             disabled={selectedOption === null}
             size="lg"
             className="flex-1 min-w-[150px] sm:flex-initial" // Buttons take equal width on mobile, then shrink
          >
            Check Answer
          </Button>
          <Button
            onClick={() => setShowSolution(!showSolution)}
            variant="outline"
            size="lg"
            aria-expanded={showSolution}
            className="flex-1 min-w-[150px] sm:flex-initial" // Buttons take equal width on mobile, then shrink
          >
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </Button>
        </div>

        {/* Check Result Feedback */}
        {isCorrect !== null && (
            <div className={`mt-4 p-3 rounded-md text-sm font-medium ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isCorrect ? 'Correct!' : 'Incorrect. Try again or view the solution.'}
            </div>
        )}

        {/* Solution Section (Conditional) */}
        {showSolution && (
          <div className="mt-6 p-4 bg-muted/40 border border-border rounded-md shadow-sm">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Solution</h3>
            {problem.solution ? (
                 <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: problem.solution }} />
            ) : (
                <p className="text-muted-foreground">No detailed solution provided.</p>
            )}
             <p className="mt-4 pt-3 border-t text-sm font-medium text-foreground">
              Correct Answer: <span className="font-bold" dangerouslySetInnerHTML={{ __html: problem.correctOption }} />
            </p>
          </div>
        )}

        {/* Author Info (Optional) */}
        {problem.author?.username && (
            <div className="text-xs text-muted-foreground pt-4 text-right border-t">
                Problem added by: {problem.author.username}
            </div>
        )}
      </div>
    </div>
  );
}