/**
 * Scrape WordPress site to map ALL images to their correct locations
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const WP_SITE = 'https://hephaestus.international';

async function fetchHTML(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function scrapeHomepage() {
  console.log('🏠 Scraping Homepage...\n');
  const html = await fetchHTML(WP_SITE);
  
  const images = {};
  
  // Find hero section image
  const heroMatch = html.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
  if (heroMatch) {
    const imgMatch = heroMatch[1].match(/src="([^"]*\.(jpg|png|webp|jpeg))"/i);
    if (imgMatch) {
      images.hero = imgMatch[1];
      console.log('Hero image:', imgMatch[1]);
    }
  }
  
  // Find benefit icons
  const benefitsMatch = html.match(/<section[^>]*class="[^"]*benefits[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
  if (benefitsMatch) {
    const benefitImgs = [...benefitsMatch[1].matchAll(/src="([^"]*Frame-\d+[^"]*\.(jpg|png))"/gi)];
    images.benefits = benefitImgs.map(m => m[1]);
    console.log('Benefit icons:', images.benefits.length);
  }
  
  // Find vertical icons
  const verticalsMatch = html.match(/<section[^>]*class="[^"]*verticals[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
  if (verticalsMatch) {
    const verticalImgs = [...verticalsMatch[1].matchAll(/src="([^"]*Mask-group[^"]*\.(jpg|png))"/gi)];
    images.verticals = verticalImgs.map(m => m[1]);
    console.log('Vertical icons:', images.verticals.length);
  }
  
  // Find all other images on homepage
  const allImgs = [...html.matchAll(/src="(https?:\/\/[^"]*flolabs\.international[^"]*\.(jpg|png|webp|jpeg))"/gi)];
  images.all = [...new Set(allImgs.map(m => m[1]))];
  console.log('All homepage images:', images.all.length);
  
  return images;
}

async function scrapeProjects() {
  console.log('\n🎨 Scraping Projects Page...\n');
  const html = await fetchHTML(`${WP_SITE}/projects/`);
  
  const projects = [];
  
  // Find project cards
  const projectMatches = [...html.matchAll(/<div[^>]*class="[^"]*project[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
  
  for (const match of projectMatches) {
    const content = match[1];
    
    // Get project title
    const titleMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    // Get project images
    const imgMatches = [...content.matchAll(/src="([^"]*\.(jpg|png|webp|jpeg))"/gi)];
    const images = imgMatches.map(m => m[1]);
    
    if (title && images.length > 0) {
      projects.push({ title, images });
      console.log(`${title}:`, images.length, 'image(s)');
    }
  }
  
  // If no structured project cards found, look for any images
  if (projects.length === 0) {
    const allImgs = [...html.matchAll(/src="([^"]*\.(jpg|png|webp|jpeg))"/gi)];
    console.log('Found', allImgs.length, 'total images on projects page');
    allImgs.slice(0, 10).forEach(m => console.log('  -', m[1]));
  }
  
  return projects;
}

async function scrapeBlogPosts() {
  console.log('\n📝 Scraping Blog Posts...\n');
  const html = await fetchHTML(`${WP_SITE}/blog/`);
  
  const posts = [];
  
  // Find blog post cards
  const postMatches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  
  for (const match of postMatches) {
    const content = match[1];
    
    // Get post title
    const titleMatch = content.match(/<h[2-4][^>]*>([^<]+)<\/h/i);
    const title = titleMatch ? titleMatch[1].trim() : null;
    
    // Get post link/slug
    const linkMatch = content.match(/href="[^"]*\/([^/"]+)\/?"/);
    const slug = linkMatch ? linkMatch[1] : null;
    
    // Get featured image
    const imgMatch = content.match(/src="([^"]*\.(jpg|png|webp|jpeg))"/i);
    const image = imgMatch ? imgMatch[1] : null;
    
    if (title && image) {
      posts.push({ title, slug, image });
      console.log(`${title.substring(0, 50)}...`);
      console.log('  Slug:', slug);
      console.log('  Image:', image.split('/').pop());
    }
  }
  
  return posts;
}

async function scrapeAboutPage() {
  console.log('\n👥 Scraping About Page...\n');
  const html = await fetchHTML(`${WP_SITE}/about/`);
  
  const images = [];
  const allImgs = [...html.matchAll(/src="([^"]*\.(jpg|png|webp|jpeg))"/gi)];
  
  allImgs.forEach(m => {
    const url = m[1];
    if (url.includes('hephaestus.international')) {
      images.push(url);
      console.log('  -', url.split('/').pop());
    }
  });
  
  return images;
}

async function main() {
  try {
    const results = {
      homepage: await scrapeHomepage(),
      projects: await scrapeProjects(),
      blog: await scrapeBlogPosts(),
      about: await scrapeAboutPage()
    };
    
    // Save results
    const outputPath = path.join(__dirname, 'wordpress-image-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n✅ Saved mapping to wordpress-image-mapping.json');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
