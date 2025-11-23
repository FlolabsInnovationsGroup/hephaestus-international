/**
 * Download WordPress images from hephaestus.international
 * 
 * Usage: node download-images.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'images');

// Create images directory if it doesn't exist
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Images to download from WordPress site
const images = [
  {
    url: 'https://hephaestus.international/wp-content/uploads/2024/11/image-33-e1731164191312.png',
    filename: 'internship-carousel-1.png',
    description: 'Remote Internship Opportunities for Students'
  },
  {
    url: 'https://hephaestus.international/wp-content/uploads/2024/11/image-29.png',
    filename: 'internship-carousel-2.png',
    description: 'Remote Internship Opportunities for professionals across the globe'
  },
  {
    url: 'https://hephaestus.international/wp-content/uploads/2024/11/Frame-1-59.png',
    filename: 'internship-carousel-3.png',
    description: 'Hands-on robotics internship opportunity for remote learners'
  },
  {
    url: 'https://hephaestus.international/wp-content/uploads/2025/06/Frame-26-1.jpg',
    filename: 'blog-hero.jpg',
    description: 'Blog page hero image'
  },
  {
    url: 'https://hephaestus.international/wp-content/uploads/2025/02/cropped-cropped-Frame-4-1-e1761930232615-1-e1761930649141.jpg',
    filename: 'logo.jpg',
    description: 'Flo Labs R&D International logo'
  }
];

/**
 * Download a file from URL
 */
function downloadImage(url, filename, description) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(IMAGES_DIR, filename);
    const file = fs.createWriteStream(filePath);

    console.log(`Downloading: ${description}`);
    console.log(`  URL: ${url}`);
    console.log(`  Saving to: ${filename}`);

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${filename}\n`);
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file if error
      reject(err);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('Starting image download from hephaestus.international...\n');
  console.log(`Images will be saved to: ${IMAGES_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const image of images) {
    try {
      await downloadImage(image.url, image.filename, image.description);
      successCount++;
      // Wait a bit between downloads to be nice to the server
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`✗ Failed to download ${image.filename}:`, error.message);
      failCount++;
    }
  }

  console.log('\n=== Download Summary ===');
  console.log(`Success: ${successCount}/${images.length}`);
  console.log(`Failed: ${failCount}/${images.length}`);
  
  if (successCount > 0) {
    console.log(`\nImages saved to: ${IMAGES_DIR}`);
    console.log('\nNext steps:');
    console.log('1. Upload images to Strapi media library');
    console.log('2. Link images to internship/project/blog entries');
    console.log('3. Update frontend to display images');
  }
}

main().catch(console.error);
