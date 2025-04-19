import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getTitleColor = (title: string) => {
  const colors: { [key: string]: string } = {
    'newbie': '#808080',
    'pupil': '#008000',
    'specialist': '#03a89e',
    'expert': '#0000ff',
    'master': '#aa00aa',
    'legendary': '#ff0000'
  };
  return colors[title.toLowerCase()] || '#000000';
};