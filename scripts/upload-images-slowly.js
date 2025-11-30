/**
 * Upload WordPress images to Strapi slowly to avoid 502 errors
 * Uploads one image at a time with longer delays
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;
const IMAGES_DIR = path.join(__dirname, 'wordpress-images');

if (!STRAPI_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN environment variable is required');
  process.exit(1);
}

async function uploadImageToStrapi(filepath, filename) {
  try {
    const formData = new FormData();
    formData.append('files', fs.createReadStream(filepath), filename);

    console.log(`  Uploading ${filename}...`);
    
    const response = await axios.post(
      `${STRAPI_URL}/api/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${STRAPI_TOKEN}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000 // 2 minute timeout
      }
    );

    console.log(`  ✓ Uploaded: ${filename}`);
    console.log(`    URL: ${response.data[0].url}\n`);
    return response.data[0];
  } catch (error) {
    if (error.response) {
      console.error(`  ✗ Failed (${error.response.status}): ${filename}`);
      console.error(`    ${JSON.stringify(error.response.data)}\n`);
    } else {
      console.error(`  ✗ Failed: ${filename}`);
      console.error(`    ${error.message}\n`);
    }
    return null;
  }
}

async function uploadAllImages() {
  const manifestPath = path.join(IMAGES_DIR, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('Error: manifest.json not found');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  console.log(`Found ${manifest.images.length} images to upload\n`);
  console.log('Uploading slowly to avoid server overload...\n');

  const uploaded = [];
  const failed = [];
  let count = 0;

  for (const image of manifest.images) {
    count++;
    console.log(`[${count}/${manifest.images.length}] ${image.filename}`);
    
    if (fs.existsSync(image.filepath)) {
      const result = await uploadImageToStrapi(image.filepath, image.filename);
      if (result) {
        uploaded.push({ ...image, strapiId: result.id, cloudinaryUrl: result.url });
      } else {
        failed.push(image);
      }
      
      // Wait 3 seconds between uploads to avoid overwhelming the server
      if (count < manifest.images.length) {
        console.log('  Waiting 3 seconds before next upload...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    } else {
      console.error(`  ⚠ File not found: ${image.filepath}\n`);
      failed.push(image);
    }
  }

  console.log(`\n=== Upload Complete ===`);
  console.log(`✅ Successful: ${uploaded.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`Total: ${manifest.images.length}`);

  // Save results
  const results = {
    uploadedAt: new Date().toISOString(),
    strapiUrl: STRAPI_URL,
    uploaded,
    failed
  };

  fs.writeFileSync(
    path.join(IMAGES_DIR, 'upload-results-new.json'),
    JSON.stringify(results, null, 2)
  );

  console.log(`\n✓ Results saved to ${IMAGES_DIR}/upload-results-new.json`);

  if (failed.length > 0) {
    console.log('\nFailed uploads:');
    failed.forEach(img => console.log(`  - ${img.filename}`));
  }
}

uploadAllImages()
  .then(() => {
    console.log('\n✓ All done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
