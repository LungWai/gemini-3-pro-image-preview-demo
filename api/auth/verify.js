/**
 * Vercel Serverless Function: Verify admin passphrase
 * 
 * This endpoint verifies the passphrase against the ADMIN_PASSPHRASE environment variable.
 * The passphrase should be set in Vercel's environment variables.
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { passphrase } = req.body;

    if (!passphrase || typeof passphrase !== 'string') {
      return res.status(400).json({ error: 'Passphrase is required' });
    }

    // Get the admin passphrase from environment variable
    const adminPassphrase = process.env.ADMIN_PASSPHRASE;

    if (!adminPassphrase) {
      console.error('ADMIN_PASSPHRASE environment variable is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Compare passphrases (constant-time comparison would be better for production)
    const isValid = passphrase === adminPassphrase;

    if (isValid) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(401).json({ error: 'Invalid passphrase' });
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

