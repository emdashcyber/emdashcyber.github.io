const organization = 'emdashcyber';
const homepageRepository = `${organization}/${organization}.github.io`;
const apiUrl = `https://api.github.com/orgs/${organization}/repos?type=public&per_page=100`;

// Keep the offline list in the same newest-repository-first order as API discovery.
export const fallbackProjects = [
  {
    name: 'phishing-detection-decision-models',
    title: 'I tested 5 AI decision models on 1,000 emails for phishing detection',
    description: 'A comparison of decision models on phishing and legitimate email detection.',
    pageUrl: 'https://emdashcyber.com/phishing-detection-decision-models/',
  },
  {
    name: 'dmarc-au',
    title: 'How are .au domains configured for email?',
    description: 'A weekly snapshot of email and DNS security for popular .au domains.',
    pageUrl: 'https://emdashcyber.com/dmarc-au/',
  },
  {
    name: 'ransomwatch',
    title: 'Ransomware victim claims, tracked over time',
    description: 'A public dashboard tracking ransomware group activity and victim claims.',
    pageUrl: 'https://emdashcyber.com/ransomwatch/',
  },
];

function nextPage(linkHeader) {
  if (!linkHeader) return null;
  const next = linkHeader.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
  return next?.[1] ?? null;
}

function safeWebUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function toProject(repo) {
  const name = repo.name;
  const knownProject = fallbackProjects.find((project) => project.name.toLowerCase() === name.toLowerCase());
  const pageUrl = safeWebUrl(repo.homepage)
    ?? `https://emdashcyber.com/${encodeURIComponent(name)}/`;

  return {
    name,
    title: knownProject?.title ?? name,
    description: knownProject?.description ?? (typeof repo.description === 'string' && repo.description.trim()
      ? repo.description.trim()
      : 'Published GitHub Pages site in the EmDash Cyber organization.'),
    pageUrl,
    createdAt: repo.created_at,
  };
}

function createdAtTime(project) {
  const timestamp = Date.parse(project.createdAt ?? '');
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export async function getPagesProjects(fetcher = globalThis.fetch) {
  try {
    if (typeof fetcher !== 'function') throw new Error('Fetch is unavailable.');

    const repositories = [];
    let url = apiUrl;
    while (url) {
      const response = await fetcher(url, {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'emdashcyber-homepage',
          ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
        },
        signal: AbortSignal.timeout(12_000),
      });
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}.`);

      const page = await response.json();
      if (!Array.isArray(page)) throw new Error('GitHub API returned an invalid repository list.');
      repositories.push(...page);
      url = nextPage(response.headers?.get?.('link'));
    }

    return repositories
      .filter((repo) =>
        repo
        && repo.private !== true
        && repo.has_pages === true
        && repo.full_name?.toLowerCase() !== homepageRepository,
      )
      .map(toProject)
      .sort((a, b) => createdAtTime(b) - createdAtTime(a) || a.name.localeCompare(b.name));
  } catch (error) {
    console.warn(`Could not refresh GitHub Pages list; using the saved list. ${error.message}`);
    return fallbackProjects.map((project) => ({ ...project }));
  }
}
