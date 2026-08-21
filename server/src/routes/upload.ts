import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../auth';
import { getPresignedUploadUrl, isS3Configured } from '../s3';

export const uploadRouter = Router();

const ALLOWED_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const ALLOWED_MIMES = Object.keys(ALLOWED_TYPES);

const presignInput = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_MIMES as [string, ...string[]]),
  purpose: z.enum(['product-image', 'license-document']),
});

/**
 * POST /upload/presigned-url — get a pre-signed URL for direct S3 upload.
 * The client uploads directly to S3, bypassing the server for the actual file transfer.
 */
uploadRouter.post('/presigned-url', requireAuth, requireRole('merchant'), async (req, res) => {
  if (!isS3Configured()) {
    return res.status(503).json({ error: 'File uploads are not configured. Set S3_* environment variables.' });
  }

  const parsed = presignInput.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid upload request.', details: parsed.error.flatten() });
  }

  const { fileName, contentType, purpose } = parsed.data;
  const ext = ALLOWED_TYPES[contentType as keyof typeof ALLOWED_TYPES];

  // Generate a unique key: purpose/userId/timestamp-filename.ext
  const timestamp = Date.now();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  const key = `${purpose}/${req.user!.id}/${timestamp}-${safeFileName}`;

  try {
    const { uploadUrl, fileUrl } = await getPresignedUploadUrl(key, contentType);
    res.json({ uploadUrl, fileUrl, key });
  } catch (err) {
    console.error('[Upload] Failed to generate presigned URL:', err);
    res.status(500).json({ error: 'Failed to generate upload URL.' });
  }
});
