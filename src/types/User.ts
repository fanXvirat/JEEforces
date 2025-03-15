export interface UserType {
    _id: string;
    username: string;
    email:string;
    avatar?: string;
    institute?: string;
    yearofstudy?: number;
    rating?: number;
    problemsSolved?: number;
    contestsParticipated?: string[]; // Store ObjectId as string
    ratingHistory?: {
        contestid: string;
        oldrating: number;
        newrating: number;
        timestamp: string; // Convert Date to string
    }[];
}
