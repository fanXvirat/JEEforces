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
    contestsJoined: Array<{
        _id: string;
        title: string;
        startTime: string;
      }>;
      ratingHistory: Array<{
        contestid: string;
        oldrating: number;
        newrating: number;
        timestamp: Date;
        contestTitle: string;
      }>;
}
