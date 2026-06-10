const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const STORAGE_URI_PREFIX = "supabase://";

function env(name) {
  return (process.env[name] || "").trim();
}

function publicBucket() {
  return env("SUPABASE_PUBLIC_BUCKET") || "publication-files";
}

function privateBucket() {
  return env("SUPABASE_PRIVATE_BUCKET") || "private-files";
}

function hasSupabaseConfig() {
  return Boolean(env("SUPABASE_URL") && env("SUPABASE_SERVICE_ROLE_KEY"));
}

let client;
function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Supabase Storage no esta configurado");
    }
    return null;
  }

  if (!client) {
    client = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return client;
}

function toStorageUri(bucket, objectPath) {
  return `${STORAGE_URI_PREFIX}${bucket}/${objectPath}`;
}

function parseStorageUri(value) {
  if (!value || typeof value !== "string" || !value.startsWith(STORAGE_URI_PREFIX)) {
    return null;
  }

  const withoutPrefix = value.slice(STORAGE_URI_PREFIX.length);
  const slashIndex = withoutPrefix.indexOf("/");
  if (slashIndex <= 0) return null;

  return {
    bucket: withoutPrefix.slice(0, slashIndex),
    objectPath: withoutPrefix.slice(slashIndex + 1),
  };
}

function isStorageUri(value) {
  return Boolean(parseStorageUri(value));
}

async function uploadLocalFile({ bucket, objectPath, localPath, contentType }) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      storedInSupabase: false,
      uri: localPath,
      bucket: null,
      objectPath: null,
    };
  }

  const bytes = fs.readFileSync(localPath);
  const { error } = await supabase.storage.from(bucket).upload(objectPath, bytes, {
    contentType: contentType || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`No se pudo subir archivo a Supabase Storage: ${error.message}`);
  }

  return {
    storedInSupabase: true,
    uri: toStorageUri(bucket, objectPath),
    bucket,
    objectPath,
  };
}

async function uploadPublicationFile(file) {
  const folder = file.mimetype?.startsWith("image/") ? "images" : "documents";
  const objectPath = path.posix.join(folder, file.filename);
  return uploadLocalFile({
    bucket: publicBucket(),
    objectPath,
    localPath: file.path,
    contentType: file.mimetype,
  });
}

async function uploadPrivateFile(file, folder) {
  const objectPath = path.posix.join(folder, file.filename);
  return uploadLocalFile({
    bucket: privateBucket(),
    objectPath,
    localPath: file.path,
    contentType: file.mimetype,
  });
}

function getPublicUrl(storagePath) {
  const parsed = parseStorageUri(storagePath);
  if (!parsed) return null;

  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data } = supabase.storage
    .from(parsed.bucket)
    .getPublicUrl(parsed.objectPath);

  return data?.publicUrl || null;
}

async function downloadStorageFile(storagePath) {
  const parsed = parseStorageUri(storagePath);
  if (!parsed) {
    const error = new Error("Ruta de Storage no valida");
    error.statusCode = 400;
    throw error;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    const error = new Error("Supabase Storage no esta configurado");
    error.statusCode = 500;
    throw error;
  }

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .download(parsed.objectPath);

  if (error) {
    const err = new Error(`No se pudo descargar archivo desde Supabase Storage: ${error.message}`);
    err.statusCode = 404;
    throw err;
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function removeStorageObjects(objects) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  const grouped = new Map();
  for (const item of objects) {
    if (!item?.bucket || !item?.objectPath) continue;
    const current = grouped.get(item.bucket) || [];
    current.push(item.objectPath);
    grouped.set(item.bucket, current);
  }

  for (const [bucket, paths] of grouped.entries()) {
    await supabase.storage.from(bucket).remove(paths);
  }
}

function removeLocalFile(localPath) {
  if (!localPath) return;
  try {
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (error) {
    console.warn(`No se pudo borrar archivo temporal: ${localPath}`, error.message);
  }
}

module.exports = {
  publicBucket,
  privateBucket,
  isStorageUri,
  parseStorageUri,
  uploadPublicationFile,
  uploadPrivateFile,
  getPublicUrl,
  downloadStorageFile,
  removeStorageObjects,
  removeLocalFile,
};
