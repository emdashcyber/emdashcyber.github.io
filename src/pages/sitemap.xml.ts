import type { APIRoute } from 'astro';
import { fallbackProjects } from '../lib/projects.mjs';

// Each project publishes its own sitemap under its base path; this index is the only one robots.txt points to.
export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://emdashcyber.com');
  const locations = [
    new URL('/sitemap-home.xml', origin).href,
    ...fallbackProjects.map((project) => new URL(`/${project.name}/sitemap.xml`, origin).href),
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations
      .map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`)
      .join('\n')}\n</sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
