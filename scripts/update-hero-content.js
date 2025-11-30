const https = require('https');

const STRAPI_URL = 'https://hephaestus-international-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN;

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

function putData(url, token, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => resolve(JSON.parse(responseData)));
    });
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function updateHero() {
  console.log('🔄 Updating hero content...\n');
  
  const sections = await fetchData(`${STRAPI_URL}/api/section-contents`);
  const heroTitle = sections.data.find(s => s.identifier === 'hero-title');
  const heroSubtitle = sections.data.find(s => s.identifier === 'hero-subtitle');
  
  if (heroTitle) {
    console.log('📝 Updating hero title...');
    await putData(
      `${STRAPI_URL}/api/section-contents/${heroTitle.documentId}`,
      STRAPI_TOKEN,
      { data: { content: 'Hephaestus Labs Institute of Experiential Learning Center of Excellence' } }
    );
    console.log('   ✅ Title updated\n');
  }
  
  console.log('🎉 Hero updated!');
}

updateHero();
