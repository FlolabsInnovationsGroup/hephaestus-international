import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const BUCKET = 'flolabs-assets';
const s3 = new S3Client({ region: 'us-east-1' });

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'CV file is required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Only PDF, DOC, and DOCX files are allowed' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'CV file must be 10MB or smaller' }, { status: 400 });
  }

  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const key = `hephaestus/cv/${Date.now()}-${safeName}`;
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    }));

    const url = `https://${BUCKET}.s3.us-east-1.amazonaws.com/${key}`;
    return NextResponse.json({
      ok: true,
      cvFileName: file.name,
      cvUrl: url,
      pathname: key,
      blobUrl: url,
      downloadUrl: url,
      contentType: file.type,
      size: file.size,
      storage: 's3',
    });
  } catch (error) {
    console.error('CV upload failed', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({
      error: 'CV upload failed. The file is valid, but storage is unavailable right now.',
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
