// app/sitemap.ts
import { MetadataRoute } from 'next';

// Define the base URL for your site
const baseUrl = 'https://jeeforces.me';

// Define types for the data we expect from your APIs for clarity
interface DynamicPost {
  _id: string;
  updatedAt?: string; // Optional, but good for SEO
}
interface UserPost {
  username: string;
  updatedAt?: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 1. Static Routes
  // These are your main pages. The homepage gets the highest priority.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/contests`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/problems`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/discussions`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ];

  // 2. Dynamic Routes
  // We will fetch all public data in parallel for efficiency.
  try {
    const [problemsRes, contestsRes, discussionsRes, usersRes] = await Promise.all([
      fetch(`${baseUrl}/api/problems`), // Your API returns all published problems
      fetch(`${baseUrl}/api/contests`), // Your API returns all published contests
      fetch(`${baseUrl}/api/discussions`),
      fetch(`${baseUrl}/api/leaderboard?limit=20000`), // Fetch all users from leaderboard
    ]);

    // Process the responses, guarding against fetch errors
    if (!problemsRes.ok || !contestsRes.ok || !discussionsRes.ok || !usersRes.ok) {
        throw new Error('One or more API fetches failed for sitemap generation');
    }

    const problems: DynamicPost[] = await problemsRes.json();
    const contests: DynamicPost[] = await contestsRes.json();
    const { discussions }: { discussions: DynamicPost[] } = await discussionsRes.json();
    const { leaderboard: users }: { leaderboard: UserPost[] } = await usersRes.json();

    // Map the data to sitemap URL objects
    const problemRoutes = problems.map(({ _id, updatedAt }) => ({
      url: `${baseUrl}/problems/${_id}`,
      lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    }));

    const contestRoutes = contests.flatMap(({ _id, updatedAt }) => ([
      { url: `${baseUrl}/contests/${_id}`, lastModified: updatedAt ? new Date(updatedAt) : new Date() },
      { url: `${baseUrl}/contests/${_id}/standings`, lastModified: updatedAt ? new Date(updatedAt) : new Date() },
    ]));

    const discussionRoutes = discussions.map(({ _id, updatedAt }) => ({
      url: `${baseUrl}/discussions/${_id}`,
      lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    }));

    // User routes are by username, which comes from your leaderboard API
    const userRoutes = users.map(({ username, updatedAt }) => ({
      url: `${baseUrl}/users/${username}`,
      lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    }));

    // Combine all routes into the final sitemap
    return [
      ...staticRoutes,
      ...problemRoutes,
      ...contestRoutes,
      ...discussionRoutes,
      ...userRoutes,
    ];

  } catch (error) {
    console.error("Sitemap Generation Error:", error);
    // If any API fails, gracefully return just the static routes.
    return staticRoutes;
  }
}