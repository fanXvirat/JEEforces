import { generateAnalysis } from "../action";
import { getPerformanceSummary } from '@/lib/performance';
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { User } from "next-auth";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!user?._id) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const { apiKey } = await request.json();
        if (!apiKey || typeof apiKey !== 'string') {
            return new Response("API key is required", { status: 400 });
        }

        const performanceData = await getPerformanceSummary(user._id);

        const finalHtml = await generateAnalysis({
            performanceData,
            userApiKey: apiKey,
        });

        return new Response(finalHtml, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });

    } catch (error: any) {
        console.error("Error in generate agent analysis API:", error);
        if (error.message?.includes('API key not valid')) {
            return new Response("Invalid Gemini API Key. Please check and try again.", { status: 400 });
        }
        return new Response("Internal Server Error", { status: 500 });
    }
}