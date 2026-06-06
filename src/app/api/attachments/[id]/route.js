import { NextResponse } from 'next/server';
import getDb from '../../../../lib/db';
import { requireAuth } from '../../../../lib/rbac';
import { handleApiError, notFound, guardResponse } from '../../../../lib/api-helpers';

// Mime types that browsers can execute/script in-origin. We never serve these with
// their original type; they are forced to octet-stream so they download instead of render.
const DANGEROUS_MIME = /^(image\/svg|text\/html|application\/xhtml|text\/xml|application\/xml|application\/javascript|text\/javascript)/i;

export async function GET(request, { params }) {
  try {
    const auth = await requireAuth()(request);
    if (!auth.authorized) return guardResponse(auth);

    const db = getDb();
    const { id } = await params;
    const attachment = await db('asset_attachments').where({ id }).first();
    if (!attachment || !attachment.data) return notFound('Attachment');

    // Force download (never inline) and disable MIME sniffing so a stored SVG/HTML
    // payload cannot execute script in the application's origin (stored XSS).
    let contentType = attachment.mimeType || 'application/octet-stream';
    if (DANGEROUS_MIME.test(contentType)) contentType = 'application/octet-stream';

    // Sanitize the filename for the header (strip quotes/CR/LF to prevent header
    // injection) and provide a UTF-8 fallback via filename*.
    const safeName = String(attachment.filename || 'download').replace(/["\r\n]/g, '_');

    return new NextResponse(attachment.data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(attachment.filename || 'download')}`,
        'Content-Length': String(attachment.size),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
