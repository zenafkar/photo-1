import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads", "generations");

// Pastikan folder uploads/generations ada
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Mengunduh gambar dari remote URL (seperti Replicate CDN) dan menyimpannya di disk VPS lokal.
 * Mengembalikan URL publik permanen dari file tersebut.
 */
export async function saveRemoteImageLocally(remoteUrl: string, req?: any): Promise<string> {
  try {
    // SSRF guard: DNS-resolve + IP range check before fetching
    const { isAllowedUrl, isAllowedUrlDeep } = await import("./urlSafety.js");
    if (!isAllowedUrl(remoteUrl)) {
      console.warn(`[Storage] Blocked unsafe remote URL: ${remoteUrl.slice(0, 100)}`);
      return remoteUrl;
    }
    // Deep check: resolve hostname and verify resolved IPs are not private
    if (!(await isAllowedUrlDeep(remoteUrl))) {
      console.warn(`[Storage] DNS-resolved IP is private/loopback, blocking: ${remoteUrl.slice(0, 100)}`);
      return remoteUrl;
    }

    // Size limit: check Content-Length before downloading
    const headRes = await fetch(remoteUrl, { method: "HEAD" }).catch(() => null);
    const contentLength = headRes?.headers?.get("content-length");
    const MAX_REMOTE_SIZE = 25 * 1024 * 1024; // 25MB
    if (contentLength && parseInt(contentLength, 10) > MAX_REMOTE_SIZE) {
      console.warn(`[Storage] Remote image too large: ${contentLength} bytes`);
      return remoteUrl;
    }

    const response = await fetch(remoteUrl);
    if (!response.ok) {
      console.warn(`[Storage] Gagal mengunduh gambar dari ${remoteUrl.slice(0, 100)}: ${response.statusText}`);
      return remoteUrl;
    }

    const contentType = response.headers.get("content-type") || "";

    // Block non-image and SVG content types
    if (contentType && !contentType.startsWith("image/")) {
      console.warn(`[Storage] Non-image content type rejected: ${contentType}`);
      return remoteUrl;
    }
    if (contentType.includes("svg")) {
      console.warn(`[Storage] SVG content type blocked (stored XSS prevention): ${contentType}`);
      return remoteUrl;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);

    const relativePath = `/api/v1/uploads/generations/${filename}`;
    const baseUrl = process.env.BACKEND_URL || (req ? `${req.protocol}://${req.get("host")}` : "");

    return baseUrl ? `${baseUrl.replace(/\/$/, "")}${relativePath}` : relativePath;
  } catch (error) {
    console.error("[Storage] Error menyimpan remote image ke lokal:", error);
    return remoteUrl;
  }
}

/**
 * Menyimpan data gambar berformat Base64 ke disk VPS lokal.
 * Mengembalikan URL publik permanen dari file tersebut.
 */
export async function saveBase64Locally(base64Data: string, req?: any): Promise<string> {
  try {
    if (!base64Data || !base64Data.startsWith("data:image")) {
      return base64Data;
    }

    const matches = base64Data.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches) {
      return base64Data;
    }

    // Block SVG — stored XSS prevention (SVG can contain scripts)
    const mimeType = matches[1].toLowerCase();
    if (mimeType === "svg" || mimeType === "svg+xml") {
      console.warn("[Storage] SVG upload blocked (XSS prevention)");
      return base64Data;
    }

    let ext = mimeType === "jpeg" ? "jpg" : mimeType;
    const buffer = Buffer.from(matches[2], "base64");

    const filename = `orig-${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    await fs.promises.writeFile(filePath, buffer);

    const relativePath = `/api/v1/uploads/generations/${filename}`;
    const baseUrl = process.env.BACKEND_URL || (req ? `${req.protocol}://${req.get("host")}` : "");

    return baseUrl ? `${baseUrl.replace(/\/$/, "")}${relativePath}` : relativePath;
  } catch (error) {
    console.error("[Storage] Error menyimpan base64 ke lokal:", error);
    return base64Data;
  }
}

/**
 * Menghapus file lokal di disk VPS jika terdapat di folder uploads.
 */
export async function deleteLocalImage(fileUrl: string): Promise<void> {
  try {
    if (!fileUrl || !fileUrl.includes("/api/v1/uploads/generations/")) return;

    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, filename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      console.log(`[Storage] Berhasil menghapus file lokal: ${filename}`);
    }
  } catch (error) {
    console.error("[Storage] Error menghapus file lokal:", error);
  }
}
