import type { VercelRequest, VercelResponse } from '@vercel/node';

interface EventStatePayload {
  state: any;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'rotemk83';
const GITHUB_REPO = process.env.GITHUB_REPO || 'wedding-seating-planner';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
const FILE_PATH = 'data/event-state.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Fetch state from GitHub
  if (req.method === 'GET') {
    if (!GITHUB_TOKEN) {
      return res.status(200).json({
        state: null,
        message: 'GITHUB_TOKEN not configured; client fallback to local cache.',
      });
    }

    try {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${GITHUB_BRANCH}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Wedding-Seating-Planner-App',
        },
      });

      if (response.status === 404) {
        return res.status(200).json({ state: null, message: 'No saved event state yet.' });
      }

      if (!response.ok) {
        const err = await response.text();
        return res.status(response.status).json({ error: `GitHub API error: ${err}` });
      }

      const fileData = await response.json();
      const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
      const state = JSON.parse(content);

      return res.status(200).json({
        state,
        sha: fileData.sha,
        lastModified: state.lastModified || new Date().toISOString(),
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Failed to fetch state: ${err.message}` });
    }
  }

  // POST: Commit updated state to GitHub
  if (req.method === 'POST') {
    const { state } = req.body as EventStatePayload;
    if (!state) {
      return res.status(400).json({ error: 'Missing state payload in request body' });
    }

    if (!GITHUB_TOKEN) {
      return res.status(200).json({
        success: true,
        persisted: 'local_only',
        message: 'Saved locally. Configure GITHUB_TOKEN for remote Git persistence.',
      });
    }

    try {
      const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_PATH}`;

      // 1. Get current SHA if file exists
      let sha: string | undefined;
      const getFileRes = await fetch(`${url}?ref=${GITHUB_BRANCH}`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Wedding-Seating-Planner-App',
        },
      });

      if (getFileRes.ok) {
        const existingData = await getFileRes.json();
        sha = existingData.sha;
      }

      // 2. Commit updated JSON
      const jsonContent = JSON.stringify(state, null, 2);
      const base64Content = Buffer.from(jsonContent, 'utf-8').toString('base64');
      const commitMessage = `Update wedding seating state - ${new Date().toISOString()}`;

      const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Wedding-Seating-Planner-App',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          branch: GITHUB_BRANCH,
          sha,
        }),
      });

      if (!putRes.ok) {
        const errText = await putRes.text();
        return res.status(putRes.status).json({ error: `GitHub Commit Failed: ${errText}` });
      }

      const result = await putRes.json();
      return res.status(200).json({
        success: true,
        persisted: 'git',
        commitSha: result.commit.sha,
        timestamp: state.lastModified,
      });
    } catch (err: any) {
      return res.status(500).json({ error: `Failed to commit state: ${err.message}` });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
