#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Data source: models.dev - An open-source database of AI models by SST
// Repository: https://github.com/sst/models.dev/tree/dev
// API: https://models.dev/api.json
const MODELS_API_URL = 'https://models.dev/api.json';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'models.json');

async function downloadModels() {
    console.log('Downloading models database from models.dev (SST project)...');

    try {
        const response = await fetch(MODELS_API_URL, {
            headers: {
                'User-Agent': '@anolilab/models-database (using SST models.dev data)',
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Ensure src directory exists
        const srcDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }

        // Write the data to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));

        console.log(`✅ Successfully downloaded models data to ${OUTPUT_FILE}`);
        console.log(`📊 Downloaded data for ${Object.keys(data).length} providers`);

        // Count total models
        let totalModels = 0;
        for (const provider of Object.values(data)) {
            if (provider.models) {
                totalModels += Object.keys(provider.models).length;
            }
        }
        console.log(`🤖 Total models: ${totalModels}`);
        console.log(`🌟 Data source: https://github.com/sst/models.dev (SST project)`);

    } catch (error) {
        console.error('❌ Failed to download models:', error.message);
        process.exit(1);
    }
}

// Run the download
downloadModels(); 