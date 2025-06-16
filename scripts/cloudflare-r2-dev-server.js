/**
 * Cloudflare R2 Development Server
 *
 * This server simulates Cloudflare R2 storage for local development.
 *
 * IMPORTANT: The JSON metadata file and all uploaded files should be stored
 * in a gitignored folder to avoid committing binary files and metadata to git.
 *
 * Expected JSON structure in ${__dirname}/miniflare-R2BucketObject/store.json:
 * {
 *   "file-key": {
 *     "key": "file-key",
 *     "blob_id": "blob-id",
 *     "version": "version",
 *     "size": 1234,
 *     "etag": "etag-value",
 *     "uploaded": 1640995200000,
 *     "checksums": {},
 *     "http_metadata": "{\"contentType\":\"image/jpeg\"}",
 *     "custom_metadata": {}
 *   }
 * }
 *
 * File blobs are stored at: ${__dirname}/${process.env.R2_BUCKET}/blobs/${blob_id}
 */

import dotenv from "dotenv";
import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import crypto from "crypto";

// Load environment variables from .env file
dotenv.config();

// ES module equivalent of __dirname
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse CLI arguments
const args = process.argv.slice(2);
const portArg = args.find((arg) => arg.startsWith("--port="));
const cliPort = portArg ? parseInt(portArg.split("=")[1]) : null;

const storeFolderPath = path.join(__dirname, ".cloudflare-dev");
const metadataPath = path.join(storeFolderPath, "R2BucketObject.json");

const loadMetadata = () => {
    try {
        if (fs.existsSync(metadataPath)) {
            const data = fs.readFileSync(metadataPath, "utf8");

            return JSON.parse(data);
        }

        return {};
    } catch (error) {
        console.error("Error loading metadata:", error);
        return {};
    }
};

const saveMetadata = (metadata) => {
    try {
        // Ensure the directory exists
        fs.mkdirSync(storeFolderPath, { recursive: true });
        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    } catch (error) {
        console.error("Error saving metadata:", error);
        throw error;
    }
};

const generateBlobId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateETag = (buffer) => {
    return crypto.createHash('md5').update(buffer).digest('hex');
};

const server = http.createServer((req, res) => {
    console.log(req.url);
    // Add CORS headers for all requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization");

    // Handle preflight OPTIONS requests
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url);
    const key = parsedUrl.pathname.slice(1); // trim the first forward slash since 'key' misses it

    try {
        if (req.method === "GET") {
            handleGetRequest(req, res, key);
        } else if (req.method === "PUT") {
            handlePutRequest(req, res, key);
        } else if (req.method === "POST") {
            handlePostRequest(req, res, key);
        } else if (req.method === "DELETE") {
            handleDeleteRequest(req, res, key);
        } else {
            res.writeHead(405, { "Content-Type": "text/plain" });
            res.end("Method Not Allowed");
        }
    } catch (error) {
        console.error("Server error:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
    }
});

const handleGetRequest = (req, res, key) => {
    const metadata = loadMetadata();

    // If no key provided, list all files
    if (!key) {
        const fileList = Object.keys(metadata).map(k => ({
            key: k,
            size: metadata[k].size,
            lastModified: new Date(metadata[k].uploaded).toISOString(),
            etag: metadata[k].etag
        }));

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ files: fileList }));
        return;
    }

    const object = metadata[key];

    if (!object) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }

    const { contentType } = JSON.parse(object.http_metadata);
    const filePath = path.join(storeFolderPath, process.env.R2_BUCKET, "blobs", object.blob_id);

    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("File Not Found");
        return;
    }

    const fileBuffer = fs.readFileSync(filePath);

    res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": object.size.toString(),
        ETag: object.etag,
        "Last-Modified": new Date(object.uploaded).toUTCString(),
        "Cache-Control": "public, max-age=31536000",
    });

    res.end(fileBuffer);
};

const handlePutRequest = (req, res, key) => {
    if (!key) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Key is required for PUT requests");
        return;
    }

    let body = Buffer.alloc(0);

    req.on("data", (chunk) => {
        body = Buffer.concat([body, chunk]);
    });

    req.on("end", () => {
        try {
            const contentType = req.headers["content-type"] || "application/octet-stream";
            const blobId = generateBlobId();
            const etag = generateETag(body);
            const uploaded = Date.now();

            // Ensure blob directory exists
            const blobDir = path.join(storeFolderPath, process.env.R2_BUCKET, "blobs");
            fs.mkdirSync(blobDir, { recursive: true });

            // Save the file
            const filePath = path.join(blobDir, blobId);
            fs.writeFileSync(filePath, body);

            // Update metadata
            const metadata = loadMetadata();
            metadata[key] = {
                key: key,
                blob_id: blobId,
                version: "1",
                size: body.length,
                etag: etag,
                uploaded: uploaded,
                checksums: {},
                http_metadata: JSON.stringify({ contentType }),
                custom_metadata: {}
            };

            saveMetadata(metadata);

            console.log(`Stored file: ${key} (${body.length} bytes)`);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                key: key,
                etag: etag,
                size: body.length,
                uploaded: new Date(uploaded).toISOString()
            }));

        } catch (error) {
            console.error("Error storing file:", error);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Error storing file");
        }
    });
};

const handlePostRequest = (req, res, key) => {
    // For POST requests, we can handle multipart uploads or return upload URLs
    // For simplicity, we'll treat POST similar to PUT for now
    handlePutRequest(req, res, key);
};

const handleDeleteRequest = (req, res, key) => {
    if (!key) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("Key is required for DELETE requests");
        return;
    }

    const metadata = loadMetadata();
    const object = metadata[key];

    if (!object) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
        return;
    }

    try {
        // Delete the file
        const filePath = path.join(storeFolderPath, process.env.R2_BUCKET, "blobs", object.blob_id);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from metadata
        delete metadata[key];
        saveMetadata(metadata);

        console.log(`Deleted file: ${key}`);

        res.writeHead(204); // No Content
        res.end();

    } catch (error) {
        console.error("Error deleting file:", error);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error deleting file");
    }
};

// Port priority: CLI arg > environment variable > default
const port = cliPort || 4902;

server.listen(port, () => {
    console.log(`R2 dev server running on http://localhost:${port}`);
});

export default server;
