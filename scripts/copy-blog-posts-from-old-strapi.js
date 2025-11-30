/**
 * Copy Blog Posts from Old Strapi to New Strapi
 */

const https = require('https');

const OLD_STRAPI_URL = 'https://strapi-production-7ecb.up.railway.app';
const NEW_STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const NEW_STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;

if (!NEW_STRAPI_TOKEN) {
  console.error('❌ Error: STRAPI_TOKEN or STRAPI_API_TOKEN not found');
  process.exit(1);
}

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', reject);
  });
}

function postData(url, token, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseData));
          } catch (error) {
            resolve(responseData);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function createBlogPost(post) {
  const strapiData = {
    title: post.title || '',
    slug: post.slug || '',
    author: post.author || 'Hephaestus Labs',
    content: post.content || '',
    publishedDate: post.publishedDate || new Date().toISOString(),
    publishedAt: new Date().toISOString(),
  };

  return postData(`${NEW_STRAPI_URL}/api/blog-posts`, NEW_STRAPI_TOKEN, { data: strapiData });
}

async function migrateBlogPosts() {
  console.log('🔄 Starting blog post migration...\n');
  console.log(`📥 Source: ${OLD_STRAPI_URL}`);
  console.log(`📤 Target: ${NEW_STRAPI_URL}\n`);

  try {
    console.log('📂 Fetching blog posts from old Strapi...');
    const oldData = await fetchData(`${OLD_STRAPI_URL}/api/blog-posts?pagination[limit]=100&populate=*`);
    const blogPosts = oldData.data || [];
    console.log(`   Found ${blogPosts.length} blog posts\n`);

    if (blogPosts.length === 0) {
      console.log('❌ No blog posts found in old Strapi');
      return;
    }

    console.log('🔍 Checking existing blog posts in new Strapi...');
    const newData = await fetchData(`${NEW_STRAPI_URL}/api/blog-posts?pagination[limit]=100`);
    const existingTitles = (newData.data || []).map(p => p.title);
    console.log(`   Found ${existingTitles.length} existing blog posts\n`);

    console.log('📤 Migrating blog posts...\n');
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const post of blogPosts) {
      const title = post.title || 'Unknown';
      
      if (existingTitles.includes(title)) {
        console.log(`⏭️  Skipping (exists): ${title}`);
        skipCount++;
        continue;
      }

      try {
        console.log(`📝 Creating: ${title}`);
        await createBlogPost(post);
        successCount++;
        console.log(`   ✅ Success\n`);
        
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        failCount++;
        console.log(`   ❌ Failed: ${error.message}\n`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`📥 Total in old Strapi: ${blogPosts.length}`);
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total in new Strapi: ${existingTitles.length + successCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 Migration complete!');
      console.log(`   View at: ${NEW_STRAPI_URL}/admin/content-manager/collection-types/api::blog-post.blog-post`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

migrateBlogPosts();
