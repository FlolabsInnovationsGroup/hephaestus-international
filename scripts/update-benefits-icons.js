/**
 * Update Benefits and Verticals icons from filenames to full Cloudinary URLs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('Error: STRAPI_TOKEN environment variable is required');
  process.exit(1);
}

// Load upload results to get filename -> URL mapping
const uploadResults = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'wordpress-images/upload-results-new.json'), 'utf8')
);

const imageUrlMapping = {};
uploadResults.uploaded.forEach(img => {
  if (img.filename && img.cloudinaryUrl) {
    imageUrlMapping[img.filename] = img.cloudinaryUrl;
  }
});

console.log(`Found ${Object.keys(imageUrlMapping).length} image URLs\n`);

async function updateContent(contentType, id, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ data });
    const url = new URL(STRAPI_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: `/api/${contentType}/${id}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function fetchContent(contentType) {
  return new Promise((resolve, reject) => {
    const url = new URL(STRAPI_URL);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: `/api/${contentType}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function updateIcons() {
  console.log('🎨 Updating Benefits icons...\n');
  
  const benefits = await fetchContent('benefits');
  
  for (const benefit of benefits.data) {
    if (benefit.icon && !benefit.icon.startsWith('http')) {
      const cloudinaryUrl = imageUrlMapping[benefit.icon];
      if (cloudinaryUrl) {
        console.log(`  Updating "${benefit.title}": ${benefit.icon} -> ${cloudinaryUrl}`);
        await updateContent('benefits', benefit.documentId, { icon: cloudinaryUrl });
        console.log(`    ✅ Updated\n`);
      } else {
        console.log(`  ⚠️  No URL found for: ${benefit.icon}\n`);
      }
    }
  }

  console.log('🎨 Updating Verticals icons...\n');
  
  const verticals = await fetchContent('verticals');
  
  for (const vertical of verticals.data) {
    if (vertical.icon && !vertical.icon.startsWith('http')) {
      const cloudinaryUrl = imageUrlMapping[vertical.icon];
      if (cloudinaryUrl) {
        console.log(`  Updating "${vertical.title}": ${vertical.icon} -> ${cloudinaryUrl}`);
        await updateContent('verticals', vertical.documentId, { icon: cloudinaryUrl });
        console.log(`    ✅ Updated\n`);
      } else {
        console.log(`  ⚠️  No URL found for: ${vertical.icon}\n`);
      }
    }
  }

  console.log('✨ All icons updated!\n');
}

updateIcons().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
