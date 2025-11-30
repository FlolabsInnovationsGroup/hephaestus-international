/**
 * Upload WordPress images to new Strapi instance
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

const IMAGES_DIR = path.join(__dirname, 'wordpress-images');

if (!STRAPI_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN environment variable is required');
  process.exit(1);
}

/**
 * Upload a file to Strapi
 */
async function uploadToStrapi(filePath) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    const filename = path.basename(filePath);
    
    form.append('files', fs.createReadStream(filePath));
    form.append('fileInfo', JSON.stringify({
      name: filename,
      alternativeText: filename.replace(/\.[^/.]+$/, '').replace(/-/g, ' ')
    }));

    const url = new URL(STRAPI_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/api/upload',
      method: 'POST',
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            resolve(response[0]); // Upload endpoint returns array
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else {
          reject(new Error(`Upload failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    form.pipe(req);
  });
}

async function main() {
  console.log('Starting WordPress image upload to Strapi...\n');

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(IMAGES_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  console.log(`Found ${files.length} images to upload\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    const filePath = path.join(IMAGES_DIR, file);
    
    try {
      console.log(`Uploading ${file}...`);
      const result = await uploadToStrapi(filePath);
      console.log(`✅ Uploaded: ${file} (ID: ${result.id})`);
      successCount++;
      
      // Small delay to avoid overwhelming Strapi
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Failed to upload ${file}: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n=== Upload Complete ===`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Total: ${files.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
