import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Upload file to IPFS
async function uploadFileToIPFS(buffer: Buffer, filename: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([buffer]);
  formData.append('file', blob, filename);

  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        pinata_api_key: process.env.PINATA_API_KEY!,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY!,
      },
    }
  );

  return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
}

// Upload JSON to IPFS
async function uploadJsonToIPFS(metadata: Record<string, unknown>): Promise<string> {
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinJSONToIPFS',
    metadata,
    {
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: process.env.PINATA_API_KEY!,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY!,
      },
    }
  );

  return `https://ipfs.io/ipfs/${response.data.IpfsHash}`;
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    // Handle file upload
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ipfsUrl = await uploadFileToIPFS(buffer, file.name);
      
      return NextResponse.json({ ipfsUrl });
    } 
    // Handle JSON upload
    else if (contentType.includes('application/json')) {
      const metadata = await req.json();
      const ipfsUrl = await uploadJsonToIPFS(metadata);
      
      return NextResponse.json({ ipfsUrl });
    } 
    else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in IPFS upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' }, 
      { status: 500 }
    );
  }
}