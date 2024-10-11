// pages/api/getGoogleMapsApiKey.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Ensure that your API key is stored in an environment variable
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key is missing' });
  }

  // Respond with the API key (this API should only be accessed by the frontend)
  res.status(200).json({ apiKey });
}
