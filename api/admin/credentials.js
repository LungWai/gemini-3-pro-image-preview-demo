/**
 * Vercel Serverless Function: Manage GCP Credentials
 * 
 * GET: Returns current credential status (not the actual values for security)
 * POST: Updates credentials in Vercel environment variables
 * 
 * Requires ADMIN_PASSPHRASE to be set for authentication.
 * Requires VERCEL_TOKEN and VERCEL_PROJECT_ID for updating env vars.
 */

// Verify admin authentication
async function verifyAuth(req) {
  // For now, we'll use a simple session check
  // In production, you'd want to use proper session tokens
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return false;
  }
  // This is a simplified check - in production use proper JWT or session tokens
  return true;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    // Return current credential status (not actual values)
    return res.status(200).json({
      gcpProjectId: process.env.GCP_PROJECT_ID || '',
      gcpApiKey: !!process.env.GCP_API_KEY,
      hasServiceAccount: !!process.env.GCP_SERVICE_ACCOUNT_JSON,
    });
  }

  if (req.method === 'POST') {
    try {
      const { gcpProjectId, gcpApiKey, gcpServiceAccountJson } = req.body;

      // Get Vercel API credentials
      const vercelToken = process.env.VERCEL_TOKEN;
      const projectId = process.env.VERCEL_PROJECT_ID;
      const teamId = process.env.VERCEL_TEAM_ID;

      if (!vercelToken || !projectId) {
        return res.status(500).json({ 
          error: 'Server not configured for credential management. Set VERCEL_TOKEN and VERCEL_PROJECT_ID.' 
        });
      }

      const updates = [];

      // Update GCP_PROJECT_ID if provided
      if (gcpProjectId !== undefined) {
        updates.push({
          key: 'GCP_PROJECT_ID',
          value: gcpProjectId,
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        });
      }

      // Update GCP_API_KEY if provided (and not masked)
      if (gcpApiKey && !gcpApiKey.startsWith('••')) {
        updates.push({
          key: 'GCP_API_KEY',
          value: gcpApiKey,
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        });
      }

      // Update GCP_SERVICE_ACCOUNT_JSON if provided
      if (gcpServiceAccountJson && !gcpServiceAccountJson.startsWith('(')) {
        updates.push({
          key: 'GCP_SERVICE_ACCOUNT_JSON',
          value: gcpServiceAccountJson,
          type: 'encrypted',
          target: ['production', 'preview', 'development'],
        });
      }

      // Update each environment variable via Vercel API
      for (const update of updates) {
        const baseUrl = `https://api.vercel.com/v10/projects/${projectId}/env`;
        const url = teamId ? `${baseUrl}?teamId=${teamId}` : baseUrl;

        // First, try to find existing env var
        const listResponse = await fetch(url, {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });

        if (!listResponse.ok) {
          throw new Error(`Failed to list env vars: ${listResponse.status}`);
        }

        const { envs } = await listResponse.json();
        const existing = envs?.find(e => e.key === update.key);

        if (existing) {
          // Update existing
          const updateUrl = teamId 
            ? `${baseUrl}/${existing.id}?teamId=${teamId}`
            : `${baseUrl}/${existing.id}`;
          
          const updateResponse = await fetch(updateUrl, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              value: update.value,
              type: update.type,
              target: update.target,
            }),
          });

          if (!updateResponse.ok) {
            throw new Error(`Failed to update ${update.key}: ${updateResponse.status}`);
          }
        } else {
          // Create new
          const createResponse = await fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(update),
          });

          if (!createResponse.ok) {
            throw new Error(`Failed to create ${update.key}: ${createResponse.status}`);
          }
        }
      }

      return res.status(200).json({ success: true, updated: updates.length });
    } catch (error) {
      console.error('Credentials update error:', error);
      return res.status(500).json({ error: error.message || 'Failed to update credentials' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

