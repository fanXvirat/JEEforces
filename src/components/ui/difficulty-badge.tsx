import { cn } from "@/lib/utils";

interface DifficultyBadgeProps {
  difficulty: number;
  className?: string;
}

export const DifficultyBadge = ({ difficulty, className }: DifficultyBadgeProps) => {
  const difficultyMap = {
    1: { text: "Easy", color: "bg-green-100 text-green-800" },
    2: { text: "Medium", color: "bg-yellow-100 text-yellow-800" },
    3: { text: "Hard", color: "bg-red-100 text-red-800" },
  };

  const { text, color } = difficultyMap[difficulty as keyof typeof difficultyMap] || 
    { text: "Unknown", color: "bg-gray-100 text-gray-800" };

  return (
    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", color, className)}>
      {text}
    </span>
  );
};