import sharp from "sharp";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const WEBP_QUALITY = 82;

function buildBasicAuthHeader(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

export async function fetchTwilioMediaAsWebpFile(
  mediaUrl: string,
  mediaContentType: string,
  accountSid?: string,
): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.has(mediaContentType)) {
    throw new Error("Unsupported WhatsApp media type. Use JPEG, PNG, or WebP image.");
  }

  const envAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const sid = accountSid ?? envAccountSid;

  const headers: HeadersInit = {};
  if (sid && authToken) {
    headers.Authorization = buildBasicAuthHeader(sid, authToken);
  }

  const response = await fetch(mediaUrl, { headers });
  if (!response.ok) {
    throw new Error(`Unable to fetch WhatsApp media (${response.status})`);
  }

  const contentType = (response.headers.get("content-type") ?? mediaContentType).split(";")[0].trim();
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    throw new Error("WhatsApp attachment is not a supported image.");
  }

  const source = Buffer.from(await response.arrayBuffer());
  const webpBuffer =
    contentType === "image/webp"
      ? source
      : await sharp(source).rotate().webp({ quality: WEBP_QUALITY }).toBuffer();

  return new File([new Uint8Array(webpBuffer)], `whatsapp-${Date.now()}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}
