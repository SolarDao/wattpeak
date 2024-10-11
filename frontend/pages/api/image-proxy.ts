import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function imageProxy(req: NextApiRequest, res: NextApiResponse) {
  const { ipfsPath } = req.query;

  if (!ipfsPath || typeof ipfsPath !== 'string') {
    return res.status(400).json({ error: 'ipfsPath query parameter is required' });
  }

  try {
    // Sanitize ipfsPath if necessary
    const sanitizedIpfsPath = ipfsPath.replace(/[^a-zA-Z0-9/._-]/g, '');

    // Pinata Gateway Token
    const pinataGatewayToken = process.env.PINATA_API_KEY;

    // Construct the IPFS gateway URL with the Pinata API key
    const ipfsGatewayUrl = `https://solar.mypinata.cloud/ipfs/${sanitizedIpfsPath}?pinataGatewayToken=${pinataGatewayToken}`;

    console.log('Fetching image from IPFS:', ipfsGatewayUrl);

    // Fetch the image from IPFS with the timeout
    const response = await axios.get(ipfsGatewayUrl, {
      responseType: 'arraybuffer',
      timeout: 10000, // 10 seconds
    });

    const contentType = response.headers['content-type'];

    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`Invalid content-type: ${contentType}`);
      return res.status(400).json({ error: 'Invalid image content' });
    }

    // Proceed to send the image
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).send(Buffer.from(response.data));

  } catch (error) {
    console.error('Error fetching image from IPFS:', (error as Error).message);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}
