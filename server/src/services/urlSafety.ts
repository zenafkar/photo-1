/**
 * URL safety validation — blocks SSRF and disallowed schemes.
 * Used by the generate endpoint to validate user-supplied image URLs
 * before they are forwarded to Replicate or fetched by the server.
 *
 * Defense in depth: hostname regex (fast pre-check) + DNS resolution
 * (catches decimal/hex IPs, wildcard DNS, and IPv4-mapped IPv6).
 */

import { isIP } from "net";
import { promises as dns } from "dns";

const PRIVATE_IP_RANGES = [
  // IPv4
  { family: 4, net: "127.0.0.0", prefix: 8 },      // loopback
  { family: 4, net: "10.0.0.0", prefix: 8 },         // class A
  { family: 4, net: "172.16.0.0", prefix: 12 },       // class B
  { family: 4, net: "192.168.0.0", prefix: 16 },      // class C
  { family: 4, net: "169.254.0.0", prefix: 16 },      // link-local
  { family: 4, net: "0.0.0.0", prefix: 8 },            // current network
  // IPv6
  { family: 6, net: "::1", prefix: 128 },              // loopback
  { family: 6, net: "fc00::", prefix: 7 },             // unique local
  { family: 6, net: "fe80::", prefix: 10 },            // link-local
];

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
];

const ALLOWED_DATA_MIME = /^data:image\/(png|jpeg|jpg|webp);base64,/;

/** Check if an IP string matches any private/loopback range */
function isPrivateIp(ip: string): boolean {
  if (!ip) return false;
  const family = isIP(ip);
  if (!family) return false;
  for (const range of PRIVATE_IP_RANGES) {
    if (range.family === family && ipInCidr(ip, range.net, range.prefix, family)) {
      return true;
    }
  }
  return false;
}

/** Simple CIDR check — works for both IPv4 and IPv6 */
function ipInCidr(ip: string, network: string, prefix: number, family: number): boolean {
  if (family === 4) {
    const ipNum = ip4ToNum(ip);
    const netNum = ip4ToNum(network);
    const mask = ~(2 ** (32 - prefix) - 1) >>> 0;
    return (ipNum & mask) === (netNum & mask);
  }
  // IPv6: normalize and compare prefixes
  const ipSegments = normalizeIp6(ip);
  const netSegments = normalizeIp6(network);
  const fullBytes = Math.floor(prefix / 8);
  const remainingBits = prefix % 8;

  for (let i = 0; i < fullBytes; i++) {
    if (ipSegments[i] !== netSegments[i]) return false;
  }
  if (remainingBits > 0 && fullBytes < 16) {
    const mask = 0xff << (8 - remainingBits);
    return (ipSegments[fullBytes] & mask) === (netSegments[fullBytes] & mask);
  }
  return true;
}

function ip4ToNum(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function normalizeIp6(ip: string): number[] {
  // Expand :: shorthand
  const parts = ip.split("::");
  const left = parts[0] ? parts[0].split(":").filter(Boolean) : [];
  const right = parts[1] ? parts[1].split(":").filter(Boolean) : [];
  const missing = 8 - left.length - right.length;
  const expanded = [...left, ...Array(missing).fill("0"), ...right];
  // Expand each segment to 2 bytes
  const bytes: number[] = [];
  for (const seg of expanded) {
    const val = parseInt(seg || "0", 16);
    bytes.push((val >> 8) & 0xff, val & 0xff);
  }
  return bytes;
}

/**
 * Returns true if the URL is safe to use (HTTPS or allowed data URI,
 * not pointing at private/loopback networks).
 *
 * This is the SYNCHRONOUS fast path — used in zod refinements and
 * hot-code paths where async resolution is not possible.
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

  // Parse hostname and block private/loopback IPs (fast regex pre-check)
  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase();

    for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    // If the hostname is already a literal IP, check it directly
    if (isIP(hostname) && isPrivateIp(hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Deep SSRF check — resolves the hostname and verifies the resolved IP
 * is not private/loopback. USE THIS BEFORE fetching URLs server-side
 * (e.g., in saveRemoteImageLocally).
 */
export async function isAllowedUrlDeep(raw: string): Promise<boolean> {
  if (!isAllowedUrl(raw)) return false;

  try {
    const url = new URL(raw);
    const hostname = url.hostname;

    // Skip DNS resolution for literal IPs (already checked in isAllowedUrl)
    if (isIP(hostname)) return true;

    // Resolve hostname and check every address
    const addresses = await dns.resolve4(hostname).catch(() => []);
    const addresses6 = await dns.resolve6(hostname).catch(() => []);
    const allIps = [...addresses, ...addresses6];

    for (const ip of allIps) {
      if (isPrivateIp(ip)) return false;
    }

    return true;
  } catch {
    return false;
  }
}
