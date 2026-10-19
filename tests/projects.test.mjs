import assert from 'node:assert/strict';
import test from 'node:test';
import { fallbackProjects, getPagesProjects } from '../src/lib/projects.mjs';

const response = (body, headers = {}) => new Response(JSON.stringify(body), { status: 200, headers });

test('discovers public Pages repositories across all API pages', async () => {
  const calls = [];
  const fetcher = async (url) => {
    calls.push(String(url));
    if (calls.length === 1) {
      return response([
        { name: 'emdashcyber.github.io', full_name: 'emdashcyber/emdashcyber.github.io', has_pages: true, created_at: '2026-03-01T00:00:00Z' },
        { name: 'phishing', full_name: 'emdashcyber/phishing', has_pages: false },
        { name: 'ransomwatch', full_name: 'emdashcyber/ransomwatch', has_pages: true, homepage: '', description: 'A longer repository description', created_at: '2026-05-01T00:00:00Z' },
      ], { link: '<https://api.github.com/orgs/emdashcyber/repos?type=public&per_page=100&page=2>; rel="next"' });
    }
    return response([
      { name: 'dmarc-au', full_name: 'emdashcyber/dmarc-au', has_pages: true, homepage: 'https://example.org/dmarc/', html_url: 'https://github.com/emdashcyber/dmarc-au', created_at: '2026-04-01T00:00:00Z' },
      { name: 'private', full_name: 'emdashcyber/private', private: true, has_pages: true, created_at: '2026-07-01T00:00:00Z' },
    ]);
  };

  const projects = await getPagesProjects(fetcher);

  assert.equal(calls.length, 2);
  assert.deepEqual(projects.map(({ name }) => name), ['ransomwatch', 'dmarc-au']);
  assert.equal(projects[0].pageUrl, 'https://emdashcyber.com/ransomwatch/');
  assert.equal(projects[0].description, fallbackProjects.find(({ name }) => name === 'ransomwatch').description);
  assert.equal(projects[0].createdAt, '2026-05-01T00:00:00Z');
  assert.equal(projects[0].title, 'Ransomware victim claims, tracked over time');
  assert.equal(projects[1].pageUrl, 'https://example.org/dmarc/');
  assert.equal(projects[1].description, fallbackProjects.find(({ name }) => name === 'dmarc-au').description);
  assert.equal(projects[1].title, 'How are .au domains configured for email?');
});

test('uses the saved site list when GitHub discovery fails', async () => {
  const projects = await getPagesProjects(async () => {
    throw new Error('offline');
  });

  assert.deepEqual(projects, fallbackProjects);
  assert.notEqual(projects, fallbackProjects);
  assert.deepEqual(projects.map(({ name }) => name), [
    'lockbit-leak',
    'phishnchips-decision-models',
    'e4eit-assurance',
    'dmarc-au',
    'ransomwatch',
  ]);
  assert.deepEqual(projects.map(({ title }) => title), [
    'Inside the LockBit 4.0 affiliate panel',
    'PhishNChips: 12 AI decision models compared on 3,011 emails',
    'Assess your enterprise IT against the ASD Essentials',
    'How are .au domains configured for email?',
    'Ransomware victim claims, tracked over time',
  ]);
});

test('uses the saved list when the API response is not successful', async () => {
  const projects = await getPagesProjects(async () => new Response('rate limited', { status: 403 }));

  assert.deepEqual(projects, fallbackProjects);
});
