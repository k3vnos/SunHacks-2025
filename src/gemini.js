// gemini.js
import * as FileSystem from "expo-file-system";
// OPTIONAL (only needed for iOS "ph://" assets)
import Constants from "expo-constants";

const GEMINI_API_KEY = Constants?.expoConfig?.extra?.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

async function normalizeLocalUri(uri) {
  // iOS gallery can return "ph://..." which FileSystem can't read directly.
  if (uri.startsWith("ph://")) {
    // Ask permission once (no-op on Android)
    await MediaLibrary.requestPermissionsAsync();
    // Try to turn the asset into a real file uri in cache
    const asset = await MediaLibrary.getAssetInfoAsync(uri);
    const src = asset.localUri || asset.uri || uri;

    const dest = FileSystem.cacheDirectory + `${asset.id}.jpg`;
    try {
      await FileSystem.copyAsync({ from: src, to: dest });
      return dest;
    } catch {
      // Fall back to original; read may still work on some devices
      return src;
    }
  }
  return uri;
}

async function toBase64(image) {
  if (typeof image !== "string") throw new Error("image must be a string");

  // If already base64 or data URL, return as is
  if (image.startsWith("data:")) return image;

  // Local file/content URI
  if (image.startsWith("file:") || image.startsWith("content:")) {
    return FileSystem.readAsStringAsync(image, { encoding: "base64" });
  }

  // Fallback: return original string
  return image;
}

export async function analyzeHazardDirect({
  title = null,
  description,
  image,
  imageMime = "image/jpeg",
}) {
  if (!GEMINI_API_KEY) throw new Error("Missing GEMINI_API_KEY");
  if (!description) throw new Error("description is required");
  if (!image) throw new Error("image is required");

  let imageBase64 = await toBase64(image);
  const commaIdx = imageBase64.indexOf(",");
  if (imageBase64.startsWith("data:") && commaIdx > -1) {
    imageBase64 = imageBase64.slice(commaIdx + 1);
  }

  const prompt = [
    "You are classifying a single street-level photo for a civic hazard app.",
    "User provided description (verbatim):",
    JSON.stringify(description),
    title ? `\nUser-supplied title (optional): ${JSON.stringify(title)}` : "",
    "",
    "Return STRICT JSON with keys:",
    '- "title": short (<= 60 chars), human-friendly',
    '- "improved_description": concise (<= 240 chars), merge photo + text',
    '- "valid_hazard": boolean (true if clearly a public hazard/nuisance)',
    '- "category": one of ["pothole","broken_sidewalk","streetlight_out","trash","signage_damage","construction_obstruction","flooding","exposed_utility","tree_blockage","other"]',
    '- "reasons": array of brief strings explaining the decision',
    "",
    "Reject selfies, indoor/private scenes, or unrelated content.",
  ].join("\n");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { mimeType: imageMime, data: imageBase64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      response_mime_type: "application/json",
    },
  };

  const resp = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini error ${resp.status}: ${text.slice(0, 400)}`);
  }

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  let parsed;
  try { parsed = JSON.parse(raw); } catch { parsed = { raw }; }
  if (title && !parsed.title) parsed.title = title;

  return parsed;
}
