import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const pinataApiKey = process.env.PINATA_API_KEY;

export default async function imageProxy(req: NextApiRequest, res: NextApiResponse) {
  const { ipfsPath } = req.query;

  if (!ipfsPath || typeof ipfsPath !== 'string') {
    return res.status(400).json({ error: 'ipfsPath query parameter is required' });
  }

  try {
    // Sanitize the IPFS path
    const sanitizedIpfsPath = ipfsPath.replace(/[^a-zA-Z0-9/._-]/g, '');

    // Construct the IPFS gateway URL using your private Pinata gateway
    const ipfsGatewayUrl = `https://solar.mypinata.cloud/ipfs/${sanitizedIpfsPath}`;
    console.log('Fetching image from IPFS:', ipfsGatewayUrl);
    

    // Fetch the image from IPFS using the API key
    const response = await axios.get(ipfsGatewayUrl, {
      headers: {
        Authorization: `Bearer ${pinataApiKey}`
      },
      responseType: 'arraybuffer',
      timeout: 10000, // 10 seconds
    });

    const contentType = response.headers['content-type'];

    if (!contentType || !contentType.startsWith('image/')) {
      return res.status(400).json({ error: 'Invalid image content' });
    }

    // Serve the image with correct headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(Buffer.from(response.data));
    
  } catch (error) {
    console.error('Error fetching image from IPFS:', (error as Error).message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}
