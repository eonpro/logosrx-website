import "server-only";
import { list } from "@vercel/blob";

export interface DependencyCheck {
  configured: boolean;
  ok: boolean;
  error?: string;
}

/**
 * Readiness probe for Vercel Blob (résumé uploads, merchandising images, the
 * catalog PDF). A cheap `list({ limit: 1 })` exercises auth + reachability
 * without transferring any object bodies. Returns `configured:false` when no
 * token is set so dev/CI without Blob don't report a false failure.
 */
export async function checkBlobStore(): Promise<DependencyCheck> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { configured: false, ok: true };
  }
  try {
    await list({ limit: 1 });
    return { configured: true, ok: true };
  } catch (err) {
    return {
      configured: true,
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
