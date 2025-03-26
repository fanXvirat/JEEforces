'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Problem {
  _id: string;
  title: string;
  difficulty: number;
  score: number;
  tags: string[];
  subject: string;
}

export default function ProblemsPage() {
  const { data: session } = useSession();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: '',
    subject: '',
    search: ''
  });

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.difficulty) params.append('difficulty', filters.difficulty);
        if (filters.subject) params.append('subject', filters.subject);
        if (filters.search) params.append('search', filters.search);

        const response = await fetch(`/api/problems?${params.toString()}`);
        const data = await response.json();
        
        // Ensure data is always an array
        setProblems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching problems:', error);
        setProblems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [filters]);

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">JEE Problems</h1>
        {session?.user?.role === 'admin' && (
          <Link href="/problems/create">
            <Button>Create Problem</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          className="p-2 border rounded"
          value={filters.difficulty}
          onChange={e => setFilters({...filters, difficulty: e.target.value})}
        >
          <option value="">All Difficulties</option>
          <option value="1">Easy</option>
          <option value="2">Medium</option>
          <option value="3">Hard</option>
        </select>

        <select
          className="p-2 border rounded"
          value={filters.subject}
          onChange={e => setFilters({...filters, subject: e.target.value})}
        >
          <option value="">All Subjects</option>
          <option value="Physics">Physics</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Mathematics">Mathematics</option>
        </select>

        <input
          type="text"
          placeholder="Search problems..."
          className="p-2 border rounded"
          value={filters.search}
          onChange={e => setFilters({...filters, search: e.target.value})}
        />
      </div>

      {/* Problems Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No problems found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Problem</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map(problem => (
              <TableRow key={problem._id}>
                <TableCell>
                  <Link 
                    href={`/problems/${problem._id}`}
                    className="font-medium hover:text-blue-600"
                  >
                    {problem.title}
                  </Link>
                </TableCell>
                <TableCell>{problem.subject}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      problem.difficulty === 1 ? 'default' : 
                      problem.difficulty === 2 ? 'secondary' : 'destructive'
                    }
                  >
                    {problem.difficulty === 1 ? 'Easy' : 
                     problem.difficulty === 2 ? 'Medium' : 'Hard'}
                  </Badge>
                </TableCell>
                <TableCell>{problem.score}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {problem.tags.map(tag => (
                      <Badge variant="secondary" key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}