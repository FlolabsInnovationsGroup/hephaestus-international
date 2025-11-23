const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const WORDPRESS_URL = 'https://hephaestus.international';
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('Error: STRAPI_API_TOKEN environment variable is required');
  process.exit(1);
}

// Helper to get filename from URL
function getFilenameFromUrl(url) {
  const urlParts = url.split('/');
  let filename = urlParts[urlParts.length - 1].split('?')[0];
  // Remove dimension suffixes like -150x150, -300x200, etc.
  filename = filename.replace(/-\d+x\d+(\.[a-z]+)$/, '$1');
  return filename;
}

async function getWordPressProjectImages() {
  try {
    console.log('Scraping WordPress projects page...');
    const response = await axios.get(`${WORDPRESS_URL}/projects`);
    const $ = cheerio.load(response.data);
    
    const projects = [];
    
    // Find project sections
    $('.project-item, article, .wp-block-group').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h2, h3, .project-title').first().text().trim();
      const description = $elem.find('p').first().text().trim();
      const images = [];
      
      $elem.find('img').each((j, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && !src.includes('gravatar')) {
          images.push(getFilenameFromUrl(src));
        }
      });
      
      if (title && images.length > 0) {
        projects.push({ title, description, images });
      }
    });
    
    console.log(`Found ${projects.length} projects with images on WordPress`);
    return projects;
  } catch (error) {
    console.error('Failed to scrape WordPress:', error.message);
    return [];
  }
}

async function getWordPressBlogImages() {
  try {
    console.log('Scraping WordPress blog page...');
    const response = await axios.get(`${WORDPRESS_URL}/blog`);
    const $ = cheerio.load(response.data);
    
    const blogs = [];
    
    $('article, .blog-post, .wp-block-post').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h2, h3, .entry-title').first().text().trim();
      const images = [];
      
      $elem.find('img').each((j, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && !src.includes('gravatar')) {
          images.push(getFilenameFromUrl(src));
        }
      });
      
      if (title && images.length > 0) {
        blogs.push({ title, images });
      }
    });
    
    console.log(`Found ${blogs.length} blog posts with images on WordPress`);
    return blogs;
  } catch (error) {
    console.error('Failed to scrape WordPress blog:', error.message);
    return [];
  }
}

async function getStrapiProjects() {
  const response = await axios.get(
    `${STRAPI_URL}/api/projects?populate=*`,
    { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }}
  );
  return response.data.data;
}

async function getStrapiBlogPosts() {
  const response = await axios.get(
    `${STRAPI_URL}/api/blog-posts?populate=*`,
    { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }}
  );
  return response.data.data;
}

async function getStrapiMediaFiles() {
  const response = await axios.get(
    `${STRAPI_URL}/api/upload/files?pagination[limit]=100`,
    { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }}
  );
  return response.data;
}

async function updateProjectImages(projectId, imageIds) {
  try {
    const response = await axios.put(
      `${STRAPI_URL}/api/projects/${projectId}`,
      { data: { images: imageIds } },
      { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }}
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update project ${projectId}:`, error.response?.data || error.message);
    return null;
  }
}

async function updateBlogPostImages(postId, imageIds) {
  try {
    const response = await axios.put(
      `${STRAPI_URL}/api/blog-posts/${postId}`,
      { data: { images: imageIds } },
      { headers: { 'Authorization': `Bearer ${STRAPI_TOKEN}` }}
    );
    return response.data;
  } catch (error) {
    console.error(`Failed to update blog post ${postId}:`, error.response?.data || error.message);
    return null;
  }
}

function findImageByFilename(mediaFiles, filename) {
  return mediaFiles.find(file => {
    const mediaFilename = file.name;
    // Try exact match first
    if (mediaFilename === filename) return true;
    // Try without extension
    const baseFilename = filename.replace(/\.[^.]+$/, '');
    const mediaBaseFilename = mediaFilename.replace(/\.[^.]+$/, '');
    if (mediaBaseFilename === baseFilename) return true;
    // Try fuzzy match (normalize underscores/hyphens)
    const normalizedFilename = filename.replace(/[-_]/g, '').toLowerCase();
    const normalizedMediaFilename = mediaFilename.replace(/[-_]/g, '').toLowerCase();
    return normalizedMediaFilename.includes(normalizedFilename) || normalizedFilename.includes(normalizedMediaFilename);
  });
}

async function linkImagesToContent() {
  console.log('\n=== Starting Image Linking Process ===\n');
  
  // Get all data
  const [wpProjects, wpBlogs, strapiProjects, strapiBlogPosts, strapiMedia] = await Promise.all([
    getWordPressProjectImages(),
    getWordPressBlogImages(),
    getStrapiProjects(),
    getStrapiBlogPosts(),
    getStrapiMediaFiles()
  ]);
  
  console.log(`\nStrapi has ${strapiMedia.length} media files`);
  console.log(`Strapi has ${strapiProjects.length} projects`);
  console.log(`Strapi has ${strapiBlogPosts.length} blog posts\n`);
  
  // Link project images
  console.log('--- Linking Project Images ---\n');
  for (const wpProject of wpProjects) {
    // Find matching Strapi project
    const strapiProject = strapiProjects.find(p => 
      p.title?.toLowerCase().includes(wpProject.title.toLowerCase()) ||
      wpProject.title.toLowerCase().includes(p.title?.toLowerCase() || '')
    );
    
    if (!strapiProject) {
      console.log(`⚠ No Strapi project found for: ${wpProject.title}`);
      continue;
    }
    
    // Find matching images
    const imageIds = [];
    for (const imgFilename of wpProject.images) {
      const mediaFile = findImageByFilename(strapiMedia, imgFilename);
      if (mediaFile) {
        imageIds.push(mediaFile.id);
      } else {
        console.log(`  ⚠ Image not found: ${imgFilename}`);
      }
    }
    
    if (imageIds.length > 0) {
      console.log(`✓ Linking ${imageIds.length} images to project: ${strapiProject.title}`);
      await updateProjectImages(strapiProject.id, imageIds);
    } else {
      console.log(`⚠ No images to link for: ${strapiProject.title}`);
    }
  }
  
  // Link blog post images
  console.log('\n--- Linking Blog Post Images ---\n');
  for (const wpBlog of wpBlogs) {
    // Find matching Strapi blog post
    const strapiBlog = strapiBlogPosts.find(p => 
      p.title?.toLowerCase().includes(wpBlog.title.toLowerCase()) ||
      wpBlog.title.toLowerCase().includes(p.title?.toLowerCase() || '')
    );
    
    if (!strapiBlog) {
      console.log(`⚠ No Strapi blog post found for: ${wpBlog.title}`);
      continue;
    }
    
    // Find matching images
    const imageIds = [];
    for (const imgFilename of wpBlog.images) {
      const mediaFile = findImageByFilename(strapiMedia, imgFilename);
      if (mediaFile) {
        imageIds.push(mediaFile.id);
      }
    }
    
    if (imageIds.length > 0) {
      console.log(`✓ Linking ${imageIds.length} images to blog: ${strapiBlog.title}`);
      await updateBlogPostImages(strapiBlog.id, imageIds);
    }
  }
  
  console.log('\n✓ Image linking complete!');
}

// Run the script
linkImagesToContent()
  .then(() => {
    console.log('\n✓ All done! Your content now has images from Cloudinary');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
