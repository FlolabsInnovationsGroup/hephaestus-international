import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'hephaestus-international',
    commitSha: process.env.BUILD_COMMIT_SHA ?? null,
    commitRef: process.env.BUILD_COMMIT_REF ?? null,
    imageTag: process.env.BUILD_IMAGE_TAG ?? null,
    imageDigest: process.env.BUILD_IMAGE_DIGEST ?? null,
    buildTimestamp: process.env.BUILD_TIMESTAMP ?? null,
    now: new Date().toISOString(),
  });
}
