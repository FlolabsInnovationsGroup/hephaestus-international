/**
 * Comprehensive script to link all Cloudinary images to Strapi content
 * Maps images from WordPress to: Projects, Blog Posts, and other sections
 */

const fs = require('fs');
const path = require('path');

const STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN or STRAPI_TOKEN environment variable is required');
  process.exit(1);
}

// Load upload results to get Strapi file IDs
const uploadResultsPath = path.join(__dirname, 'wordpress-images/upload-results-new.json');
const uploadResultsPathOld = path.join(__dirname, 'wordpress-images/upload-results.json');
const uploadResultsFile = fs.existsSync(uploadResultsPath) ? uploadResultsPath : uploadResultsPathOld;

const uploadResults = JSON.parse(fs.readFileSync(uploadResultsFile, 'utf8'));

// Create mapping: filename -> strapiId
const imageMapping = {};
uploadResults.uploaded.forEach(img => {
  if (img.filename && img.strapiId) {
    imageMapping[img.filename] = img.strapiId;
    // Also map without extension for easier matching
    const nameWithoutExt = img.filename.replace(/\.(jpg|png|webp|jpeg)$/i, '');
    imageMapping[nameWithoutExt] = img.strapiId;
  }
});

console.log(`📋 Loaded ${Object.keys(imageMapping).length / 2} images from Cloudinary`);
console.log('');

// Project image mappings based on WordPress site
const projectImageMappings = {
  'CAIPO': ['11.png', '12.png'],
  'Flo Travel': ['13.png', '14.png'],
  'MoodChanger': ['15.png'],
  'Flo Studios': ['image-29.png', 'image-33-e1731164191312.png'],
  'Flo Labs': ['image-1.png'],
  'Flo International': ['Group-1.png'],
  'MoodChanger for Pets': ['image-52-2.jpg'],
  'Humanoid Robots': ['Frame-1-59.png']
};

// Blog post featured image mappings
const blogImageMappings = {
  'Robot-As-A-Service': 'Robot-As-A-Service.png',
  'future-of-ai': 'future-of-AI.webp',
  'humanoid-robot-programming': 'humanoid-robot-programming-code.png',
  '5-beginners': '5-Beginners.png',
  'ai-internship': 'AI-Internship.png'
};

async function linkProjectImages() {
  console.log('🖼️  Linking Project Images...\n');
  
  const response = await fetch(`${STRAPI_URL}/api/projects`, {
    headers: { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }
  });
  
  const { data: projects } = await response.json();
  
  for (const project of projects) {
    const imageFiles = projectImageMappings[project.title];
    
    if (!imageFiles || imageFiles.length === 0) {
      console.log(`  ⚠️  No image mapping for project: ${project.title}`);
      continue;
    }
    
    const imageIds = imageFiles
      .map(filename => {
        const nameWithoutExt = filename.replace(/\.(jpg|png|webp|jpeg)$/i, '');
        return imageMapping[nameWithoutExt] || imageMapping[filename];
      })
      .filter(Boolean);
    
    if (imageIds.length === 0) {
      console.log(`  ⚠️  No images found in Cloudinary for: ${project.title}`);
      continue;
    }
    
    console.log(`  Updating "${project.title}" with ${imageIds.length} image(s)...`);
    
    const updateResponse = await fetch(`${STRAPI_URL}/api/projects/${project.documentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          images: imageIds
        }
      })
    });
    
    if (updateResponse.ok) {
      console.log(`    ✅ Linked ${imageIds.length} image(s)`);
    } else {
      console.error(`    ❌ Failed: ${updateResponse.statusText}`);
    }
  }
}

async function linkBlogImages() {
  console.log('\n📝 Linking Blog Post Featured Images...\n');
  
  const response = await fetch(`${STRAPI_URL}/api/blog-posts`, {
    headers: { 'Authorization': `Bearer ${STRAPI_API_TOKEN}` }
  });
  
  const { data: blogPosts } = await response.json();
  
  for (const post of blogPosts) {
    // Try to match blog post slug to image mapping
    let imageFilename = null;
    
    // Check if slug matches any of our mappings
    for (const [key, filename] of Object.entries(blogImageMappings)) {
      if (post.slug && post.slug.toLowerCase().includes(key)) {
        imageFilename = filename;
        break;
      }
    }
    
    if (!imageFilename) {
      console.log(`  ⚠️  No image mapping for blog post: ${post.title} (${post.slug})`);
      continue;
    }
    
    const nameWithoutExt = imageFilename.replace(/\.(jpg|png|webp|jpeg)$/i, '');
    const imageId = imageMapping[nameWithoutExt] || imageMapping[imageFilename];
    
    if (!imageId) {
      console.log(`  ⚠️  Image not found in Cloudinary: ${imageFilename}`);
      continue;
    }
    
    console.log(`  Updating "${post.title}" with featured image...`);
    
    const updateResponse = await fetch(`${STRAPI_URL}/api/blog-posts/${post.documentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          featuredImage: imageId
        }
      })
    });
    
    if (updateResponse.ok) {
      console.log(`    ✅ Linked featured image`);
    } else {
      console.error(`    ❌ Failed: ${updateResponse.statusText}`);
    }
  }
}

async function main() {
  try {
    await linkProjectImages();
    await linkBlogImages();
    console.log('\n✨ All images linked successfully!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
