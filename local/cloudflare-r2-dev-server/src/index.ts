import sqlite3 from "sqlite3";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serve } from '@hono/node-server'

class R2Object {
  key!: string;
  blob_id!: string;
  version!: string;
  size!: number;
  etag!: string;
  uploaded!: number;
  checksums!: { [key: string]: string };

  http_metadata!: { [key: string]: string };
  custom_metadata!: { [key: string]: string };
}

const R2_BUCKET_NAME = "local-bucket"

const databasePath = `./miniflare-R2BucketObject.sqlite`;
const database = new sqlite3.Database(databasePath);

const app = new Hono();

app.use(
    "*",
    logger((message) => {
        console.log(message);
    }),
);

app.get("/*", (c) => {
  const key = c.req.path.slice(1); // trim the first forward slash since 'key' misses it
  
  return new Promise((resolve) => {
    database.get(
      `SELECT * FROM _mf_objects WHERE key = ?`,
      [key],
      (err, object) => {
        if (err || !object) {
          resolve(c.notFound());
          return;
        }
        // Type guard for object properties
        const http_metadata = (object && typeof object === 'object' && 'http_metadata' in object) ? String(object.http_metadata) : '{}';
        const blob_id = (object && typeof object === 'object' && 'blob_id' in object) ? String(object.blob_id) : '';
        const size = (object && typeof object === 'object' && 'size' in object) ? Number(object.size) : 0;
        const etag = (object && typeof object === 'object' && 'etag' in object) ? String(object.etag) : '';
        const uploaded = (object && typeof object === 'object' && 'uploaded' in object) ? Number(object.uploaded) : Date.now();
        const { contentType } = JSON.parse(http_metadata);
        const path = `./${R2_BUCKET_NAME}/blobs/${blob_id}`;
        // Use Node.js fs to read file as stream
        const fs = require("fs");
        if (!fs.existsSync(path)) {
          resolve(c.notFound());
          return;
        }
        const stream = fs.createReadStream(path);
        const headers = new Headers();
        headers.set("Content-Type", contentType);
        headers.set("Content-Length", size.toString());
        headers.set("ETag", etag);
        headers.set("Last-Modified", new Date(uploaded).toUTCString());
        headers.set("Cache-Control", "public, max-age=31536000");
        resolve(c.body(stream, { headers }));
      }
    );
  });
});

app.put("/*", async (c) => {
  // The path is /<bucket>/<key>
  const pathParts = c.req.path.slice(1).split("/");
  const bucket = pathParts.shift();
  const key = pathParts.join("/");

  if (!bucket || !key) {
    return c.text("Missing bucket or key in path", 400);
  }

  // Only allow the configured bucket
  if (bucket !== R2_BUCKET_NAME) {
    return c.text("Invalid bucket", 404);
  }

  // Get the raw file contents
  const fileBuffer = Buffer.from(await c.req.arrayBuffer());

  // Save file to R2 path
  const fs = require("fs");
  const destPath = `./${bucket}/blobs/${key}`;
  // Ensure directory exists
  fs.mkdirSync(require("path").dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, fileBuffer);

  // Insert or update metadata in sqlite DB
  const size = fileBuffer.length;
  const etag = Math.random().toString(36).slice(2, 10); // simple random etag
  const uploaded = Date.now();
  const contentType = c.req.header("content-type") || "application/octet-stream";
  const http_metadata = JSON.stringify({ contentType });

  // Upsert into _mf_objects
  database.run(
    `INSERT INTO _mf_objects (key, blob_id, version, size, etag, uploaded, checksums, http_metadata, custom_metadata)
     VALUES (?, ?, '', ?, ?, ?, '{}', ?, '{}')
     ON CONFLICT(key) DO UPDATE SET
       blob_id=excluded.blob_id,
       size=excluded.size,
       etag=excluded.etag,
       uploaded=excluded.uploaded,
       http_metadata=excluded.http_metadata` +
      ";",
    [key, key, size, etag, uploaded, http_metadata]
  );

  return c.text("Upload successful");
});

serve(app);

// graceful shutdown
process.on('SIGINT', () => {
    server.close()
    process.exit(0)
  })
  process.on('SIGTERM', () => {
    server.close((err) => {
      if (err) {
        console.error(err)
        process.exit(1)
      }
      process.exit(0)
    })
  })