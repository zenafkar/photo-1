/**
 * URL safety validation — blocks SSRF and disallowed schemes.
 * Used by the generate endpoint to validate user-supplied image URLs
 * before they are forwarded to Replicate or fetched by the server.
 */

const BLOCKED_IP_PATTERNS = [
  /^127\./,                    // loopback
  /^10\./,                     // private class A
  /^172\.(1[6-9]|2\d|3[01])\./, // private class B
  /^192\.168\./,               // private class C
  /^169\.254\./,               // link-local (AWS/cloud metadata)
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  /^\[::1\]$/,
  /^fc00:/i,                   // IPv6 unique local
  /^fe80:/i,                   // IPv6 link-local
];

const ALLOWED_SCHEMES = ["https:", "data:"];

const ALLOWED_DATA_MIME = /^data:image\/(png|jpeg|jpg|webp);base64,/;

/**
 * Returns true if the URL is safe to use (HTTPS or allowed data URI,
 * not pointing at private/loopback networks).
 */
export function isAllowedUrl(raw: string): boolean {
  if (!raw || typeof raw !== "string") return false;

  // Data URIs: allow only PNG/JPEG/WebP base64
  if (raw.startsWith("data:")) {
    return ALLOWED_DATA_MIME.test(raw);
  }

  // HTTPS only
  if (!raw.startsWith("https://")) {
    return false;
  }

  // Parse hostname and block private/loopback IPs
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();

    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
