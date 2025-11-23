const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

const WORDPRESS_URL = 'https://hephaestus.international';
const OUTPUT_DIR = path.join(__dirname, 'wordpress-images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000
    });

    const filepath = path.join(OUTPUT_DIR, filename);
    await pipeline(response.data, fs.createWriteStream(filepath));
    console.log(`✓ Downloaded: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error.message);
    return null;
  }
}

async function extractImagesFromPage(pageUrl) {
  try {
    console.log(`\nFetching: ${pageUrl}`);
    const response = await axios.get(pageUrl, { timeout: 30000 });
    const $ = cheerio.load(response.data);
    const images = [];

    // Find all images
    $('img').each((i, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src');
      if (src && !src.includes('gravatar') && !src.includes('emoji')) {
        let imageUrl = src;
        
        // Handle relative URLs
        if (src.startsWith('/')) {
          imageUrl = WORDPRESS_URL + src;
        } else if (!src.startsWith('http')) {
          imageUrl = WORDPRESS_URL + '/' + src;
        }

        // Get filename from URL
        const urlParts = imageUrl.split('/');
        let filename = urlParts[urlParts.length - 1].split('?')[0];
        
        // Remove dimension suffixes like -150x150, -300x200, etc.
        filename = filename.replace(/-\d+x\d+(\.[a-z]+)$/, '$1');

        images.push({ url: imageUrl, filename });
      }
    });

    return images;
  } catch (error) {
    console.error(`Failed to fetch ${pageUrl}:`, error.message);
    return [];
  }
}

async function getAllWordPressImages() {
  const pagesToScrape = [
    WORDPRESS_URL,
    `${WORDPRESS_URL}/projects`,
    `${WORDPRESS_URL}/about`,
    `${WORDPRESS_URL}/internships`,
    `${WORDPRESS_URL}/blog`,
  ];

  const allImages = new Map(); // Use Map to deduplicate by filename

  // Scrape all pages
  for (const pageUrl of pagesToScrape) {
    const images = await extractImagesFromPage(pageUrl);
    images.forEach(img => {
      if (!allImages.has(img.filename)) {
        allImages.set(img.filename, img.url);
      }
    });
  }

  // Also check WordPress media uploads directly
  console.log('\nChecking WordPress uploads directory...');
  const uploadPatterns = [
    '/wp-content/uploads/',
  ];

  // Download all unique images
  console.log(`\n\nDownloading ${allImages.size} unique images...\n`);
  const downloaded = [];
  
  for (const [filename, url] of allImages) {
    const filepath = await downloadImage(url, filename);
    if (filepath) {
      downloaded.push({ filename, filepath, url });
    }
  }

  console.log(`\n✓ Downloaded ${downloaded.length} images to ${OUTPUT_DIR}`);
  
  // Save manifest
  const manifest = {
    downloadedAt: new Date().toISOString(),
    source: WORDPRESS_URL,
    images: downloaded
  };
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`✓ Saved manifest to ${OUTPUT_DIR}/manifest.json`);
  
  return downloaded;
}

// Run the script
getAllWordPressImages()
  .then(images => {
    console.log('\n✓ Image download complete!');
    console.log(`\nNext step: Run the upload script to push these to Strapi/Cloudinary`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
