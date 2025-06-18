// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://jeeforces.me';

  // We only list the main, static routes.
  const staticRoutes = [
    '/',
    '/contests',
    '/problems',
    '/discussions',
    '/leaderboard',
    '/about',
  ];

  return staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}