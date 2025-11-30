/**
 * Copy Internships from Old Strapi to New Strapi
 */

const https = require('https');

const OLD_STRAPI_URL = 'https://strapi-production-7ecb.up.railway.app';
const NEW_STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const NEW_STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;

if (!NEW_STRAPI_TOKEN) {
  console.error('❌ Error: STRAPI_TOKEN or STRAPI_API_TOKEN not found');
  console.log('Please export: export STRAPI_TOKEN="your-token-here"');
  process.exit(1);
}

/**
 * Fetch data via HTTPS GET
 */
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

/**
 * Post data via HTTPS
 */
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

/**
 * Create an internship in new Strapi
 */
async function createInternship(internship) {
  const strapiData = {
    title: internship.title || '',
    slug: internship.slug || '',
    status: internship.status || 'Open',
    location: internship.location || 'Remote',
    duration: internship.duration || '3-6 months',
    description: internship.description || '',
    requirements: internship.requirements || '',
    responsibilities: internship.responsibilities || '',
    hubspotFormId: internship.hubspotFormId || '',
    featured: internship.featured || false,
    publishedAt: new Date().toISOString(),
  };

  return postData(`${NEW_STRAPI_URL}/api/internships`, NEW_STRAPI_TOKEN, { data: strapiData });
}

/**
 * Main migration function
 */
async function migrateInternships() {
  console.log('🔄 Starting internship migration...\n');
  console.log(`📥 Source: ${OLD_STRAPI_URL}`);
  console.log(`📤 Target: ${NEW_STRAPI_URL}\n`);

  try {
    // Fetch all internships from old Strapi
    console.log('📂 Fetching internships from old Strapi...');
    const oldData = await fetchData(`${OLD_STRAPI_URL}/api/internships?pagination[limit]=100&populate=*`);
    const internships = oldData.data || [];
    console.log(`   Found ${internships.length} internships\n`);

    if (internships.length === 0) {
      console.log('❌ No internships found in old Strapi');
      return;
    }

    // Check existing internships in new Strapi
    console.log('🔍 Checking existing internships in new Strapi...');
    const newData = await fetchData(`${NEW_STRAPI_URL}/api/internships?pagination[limit]=100`);
    const existingTitles = (newData.data || []).map(i => i.title);
    console.log(`   Found ${existingTitles.length} existing internships\n`);

    // Migrate each internship
    console.log('📤 Migrating internships...\n');
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const internship of internships) {
      const title = internship.title || 'Unknown';
      
      // Skip if already exists
      if (existingTitles.includes(title)) {
        console.log(`⏭️  Skipping (exists): ${title}`);
        skipCount++;
        continue;
      }

      try {
        console.log(`📝 Creating: ${title}`);
        await createInternship(internship);
        successCount++;
        console.log(`   ✅ Success\n`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (error) {
        failCount++;
        console.log(`   ❌ Failed: ${error.message}\n`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`📥 Total in old Strapi: ${internships.length}`);
    console.log(`✅ Successfully migrated: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📝 Total in new Strapi: ${existingTitles.length + successCount}`);
    console.log('='.repeat(60));

    if (successCount > 0) {
      console.log('\n🎉 Migration complete!');
      console.log(`   View at: ${NEW_STRAPI_URL}/admin/content-manager/collection-types/api::internship.internship`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateInternships();
