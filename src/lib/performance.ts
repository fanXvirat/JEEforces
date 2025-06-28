import dbConnect from "@/lib/dbConnect";
import mongoose from "mongoose";

// Import models to register them
import "@/backend/models/Submission.model";
import "@/backend/models/Problem.model";

interface TagSummary {
  [tag: string]: {
    correct: number;
    incorrect: number;
    accuracy: number;
  };
}

export async function getPerformanceSummary(userId: string) {
    await dbConnect();
    
    // Use models from mongoose registry after ensuring they're imported
    const SubmissionModel = mongoose.models.Submission;
    const ProblemModel = mongoose.models.Problem;
    
    if (!SubmissionModel) {
        throw new Error('Submission model not found. Make sure the model is properly registered.');
    }
    
    if (!ProblemModel) {
        throw new Error('Problem model not found. Make sure the model is properly registered.');
    }
    
    // Find submissions where a contest doesn't exist (i.e., practice mode)
    // and populate the associated problem details.
    const submissions = await SubmissionModel.find({ 
        user: new mongoose.Types.ObjectId(userId),
        contest: { $exists: false }
    }).populate<{ problem: { subject: string; tags: string[] } }>('problem', 'tags subject');

    const tagSummary: TagSummary = {};
    const subjectSummary: { [subject: string]: { correct: number; incorrect: number; accuracy: number; } } = {};

    for (const sub of submissions) {
        if (!sub.problem) continue;

        const subjects: string[] = [sub.problem.subject];
        const tags: string[] = sub.problem.tags;
        const isCorrect = sub.verdict === 'Correct' || sub.verdict === 'Accepted';

        const processCategory = (category: string, summary: any) => {
            if (!summary[category]) {
                summary[category] = { correct: 0, incorrect: 0 };
            }
            if (isCorrect) {
                summary[category].correct++;
            } else {
                summary[category].incorrect++;
            }
        };

        // Process each subject and tag for the submission
        subjects.forEach((subject: string) => processCategory(subject, subjectSummary));
        tags.forEach((tag: string) => processCategory(tag, tagSummary));
    }
    
    // Helper function to calculate accuracy for each category in a summary
    const calculateAccuracy = (summary: any) => {
      for (const key in summary) {
        const { correct, incorrect } = summary[key];
        const total = correct + incorrect;
        summary[key].accuracy = total > 0 ? (correct / total) * 100 : 0;
      }
      return summary;
    }

    return {
      tagSummary: calculateAccuracy(tagSummary),
      subjectSummary: calculateAccuracy(subjectSummary),
    };
}