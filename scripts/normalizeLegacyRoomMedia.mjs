import fs from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const publicSiteRoot = path.join(repoRoot, "Almaris HTML");
const publicAssetsRoot = path.join(publicSiteRoot, "public");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

function parseEnvFile(filePath) {
  try {
    const source = readFileSync(filePath, "utf8");
    return source.split(/\r?\n/).reduce((accumulator, line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        return accumulator;
      }

      const separatorIndex = trimmed.indexOf("=");
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
      accumulator[key] = value;
      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

function resolveSupabaseUrl() {
  if (process.env.SUPABASE_URL) {
    return process.env.SUPABASE_URL;
  }

  const adminEnv = parseEnvFile(path.join(repoRoot, "hotel-admin-vite/package/.env"));
  const publicEnv = parseEnvFile(path.join(repoRoot, "Almaris HTML/.env.local"));
  return adminEnv.VITE_SUPABASE_URL ?? publicEnv.VITE_SUPABASE_URL ?? "";
}

function resolveServiceRoleKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function sanitizePathSegment(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapLegacyUrlToLocalPath(legacyUrl) {
  if (!legacyUrl || !legacyUrl.startsWith("/images/")) {
    return null;
  }

  const relativeAssetPath = legacyUrl.replace(/^\//, "");
  return path.join(publicAssetsRoot, relativeAssetPath);
}

async function ensureBucket(client) {
  const { data: buckets, error } = await client.storage.listBuckets();
  if (error) {
    throw error;
  }

  if (buckets.some((bucket) => bucket.name === "hotel-media")) {
    return;
  }

  if (dryRun) {
    console.log("[dry-run] Would create bucket hotel-media");
    return;
  }

  const { error: createError } = await client.storage.createBucket("hotel-media", {
    public: true,
    fileSizeLimit: "10MB",
  });

  if (createError) {
    throw createError;
  }
}

async function uploadLocalAsset(client, { hotelId, roomTypeId, mediaKind, sourceUrl, localPath, order = 1 }) {
  const fileName = path.basename(localPath);
  const storagePath = `${hotelId}/room-types/${roomTypeId}/migrated/${mediaKind}/${String(order).padStart(2, "0")}-${sanitizePathSegment(fileName)}`;
  const fileBuffer = await fs.readFile(localPath);

  if (dryRun) {
    console.log(`[dry-run] Would upload ${sourceUrl} -> ${storagePath}`);
    return `DRY_RUN://${storagePath}`;
  }

  const { error: uploadError } = await client.storage.from("hotel-media").upload(storagePath, fileBuffer, {
    cacheControl: "3600",
    upsert: true,
    contentType: guessContentType(localPath),
  });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = client.storage.from("hotel-media").getPublicUrl(storagePath);
  return data.publicUrl;
}

function guessContentType(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

async function migrateRoomTypeMedia(client, roomTypeRow) {
  const updates = {};

  if (roomTypeRow.image_url?.startsWith("/images/")) {
    const localPath = mapLegacyUrlToLocalPath(roomTypeRow.image_url);
    if (localPath) {
      updates.image_url = await uploadLocalAsset(client, {
        hotelId: roomTypeRow.hotel_id,
        roomTypeId: roomTypeRow.id,
        mediaKind: "hero",
        sourceUrl: roomTypeRow.image_url,
        localPath,
      });
    }
  }

  if (roomTypeRow.form_image_url?.startsWith("/images/")) {
    const localPath = mapLegacyUrlToLocalPath(roomTypeRow.form_image_url);
    if (localPath) {
      updates.form_image_url = await uploadLocalAsset(client, {
        hotelId: roomTypeRow.hotel_id,
        roomTypeId: roomTypeRow.id,
        mediaKind: "form",
        sourceUrl: roomTypeRow.form_image_url,
        localPath,
      });
    }
  }

  if (!Object.keys(updates).length) {
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] Would update room_types ${roomTypeRow.id}`, updates);
    return;
  }

  const { error } = await client.from("room_types").update(updates).eq("id", roomTypeRow.id);
  if (error) {
    throw error;
  }
}

async function migrateGalleryMedia(client, roomTypeRow, galleryRows) {
  for (const galleryRow of galleryRows) {
    if (!galleryRow.image_url?.startsWith("/images/")) {
      continue;
    }

    const localPath = mapLegacyUrlToLocalPath(galleryRow.image_url);
    if (!localPath) {
      continue;
    }

    const publicUrl = await uploadLocalAsset(client, {
      hotelId: roomTypeRow.hotel_id,
      roomTypeId: roomTypeRow.id,
      mediaKind: "gallery",
      sourceUrl: galleryRow.image_url,
      localPath,
      order: galleryRow.display_order ?? 1,
    });

    if (dryRun) {
      console.log(`[dry-run] Would update room_type_gallery_images ${galleryRow.id} -> ${publicUrl}`);
      continue;
    }

    const { error } = await client
      .from("room_type_gallery_images")
      .update({ image_url: publicUrl })
      .eq("id", galleryRow.id);

    if (error) {
      throw error;
    }
  }
}

async function main() {
  const supabaseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();
  const hotelId = process.env.HOTEL_ID ?? "royale-jazz-kingston";

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL or VITE_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  await ensureBucket(client);

  const { data: roomTypes, error: roomTypesError } = await client
    .from("room_types")
    .select("id, hotel_id, code, title, image_url, form_image_url")
    .eq("hotel_id", hotelId)
    .order("display_order", { ascending: true });

  if (roomTypesError) {
    throw roomTypesError;
  }

  const { data: galleryRows, error: galleryError } = await client
    .from("room_type_gallery_images")
    .select("id, room_type_id, image_url, display_order")
    .order("display_order", { ascending: true });

  if (galleryError) {
    throw galleryError;
  }

  const galleryIndex = galleryRows.reduce((accumulator, row) => {
    const current = accumulator.get(row.room_type_id) ?? [];
    current.push(row);
    accumulator.set(row.room_type_id, current);
    return accumulator;
  }, new Map());

  for (const roomTypeRow of roomTypes) {
    console.log(`Processing ${roomTypeRow.title} (${roomTypeRow.code})`);
    await migrateRoomTypeMedia(client, roomTypeRow);
    await migrateGalleryMedia(client, roomTypeRow, galleryIndex.get(roomTypeRow.id) ?? []);
  }

  console.log(dryRun ? "Dry run completed." : "Legacy room media migration completed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
