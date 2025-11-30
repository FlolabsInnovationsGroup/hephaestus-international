/**
 * Create Projects in Strapi
 * 
 * Usage: STRAPI_TOKEN=xxx node create-projects.js
 */

const https = require('https');

const STRAPI_URL = process.env.STRAPI_URL || 'https://hephaestus-international-production.up.railway.app';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;

if (!STRAPI_TOKEN) {
  console.error('Error: STRAPI_TOKEN environment variable is required');
  process.exit(1);
}

const projects = [
  {
    title: 'Flo Labs',
    slug: 'flo-labs',
    description: '<p><strong>What The Project Is:</strong> The official portal for Flo Labs\' Research and Development.</p><p><strong>Current Work:</strong> Redesigning the site to reflect ongoing changes at Flo Labs.</p>',
    link: 'https://www.flomadlabs.com/',
    order: 1
  },
  {
    title: 'Flo Travel',
    slug: 'flo-travel',
    description: '<p><strong>What The Project Is:</strong> A next-gen travel platform integrating AI and multimodal transportation to create seamless, personalized travel experiences.</p><p><strong>Current Work:</strong> Developing a sophisticated AI chatbot and enhancing the website for intuitive travel planning.</p>',
    link: 'https://www.flomadtravel.com/',
    order: 2
  },
  {
    title: 'Flo International',
    slug: 'flo-international',
    description: '<p><strong>What The Project Is:</strong> A global platform showcasing Flo Labs\' diverse initiatives, partnerships, and cutting-edge innovations in AI and technology.</p><p><strong>Current Work:</strong> Redesigning the website to better highlight Flo Labs\' mission, ongoing projects, and opportunities for collaboration and internships.</p>',
    link: 'https://flomad.international/',
    order: 3
  },
  {
    title: 'CAIPO',
    slug: 'caipo',
    description: '<p><strong>What Project Is:</strong> An advanced AI-driven platform designed to deliver predictive analytics, actionable insights, and innovative solutions for industries like healthcare, education, and beyond.</p><p><strong>Current Work Focus</strong></p>',
    link: 'https://www.caipo.ai/',
    order: 4
  },
  {
    title: 'MoodChanger',
    slug: 'moodchanger',
    description: '<p><strong>What Project Is:</strong> An AI-powered platform designed to enhance emotional well-being. It leverages advanced AI models to analyze user inputs and generate practical advice to improve happiness and reduce stress.</p><p><strong>Current Work Focus</strong></p>',
    link: 'https://www.flomadlabs.com/moodchanger-people',
    order: 5
  },
  {
    title: 'MoodChanger for Pets',
    slug: 'moodchanger-for-pets',
    description: '<p><strong>What The Project Is:</strong> Expanding MoodChanger for pet owners by using data from wearable devices, environmental factors, and AI analysis to provide actionable insights into pets\' behaviors, moods, and overall health.</p><p><strong>Current Work Focus</strong></p>',
    link: 'https://www.canva.com/design/DAGYja1TUd4/0uXWmOksp8B2tV22841r9g/view',
    order: 6
  },
  {
    title: 'Humanoid Robots',
    slug: 'humanoid-robots',
    description: '<p><strong>What The Project Is:</strong> A major milestone in our mission to push the boundaries of intelligent systems and human-robot interaction and include that interns who join our program may have the opportunity to contribute directly to this groundbreaking initiative.</p><p>We are also launching RoboCollective.ai. Our one stop shop for all our robots and our partners robots and accessories.</p><p><strong>Current Work Focus</strong></p>',
    link: 'https://flomadlabs.com/',
    order: 7
  },
  {
    title: 'Flo Studios',
    slug: 'flo-studios',
    description: '<p><strong>What The Project Is:</strong> Flo Studios will serve as a hub for creativity and innovation, bringing together UX/UI designers, multimedia creators, and marketing strategists to work on groundbreaking internal projects. We are currently upgrading and launching several new websites, including Flo Studios and our Robot Dealership site. If you\'re interested in website development, this could be a great opportunity to get involved.</p><p>While AI is a core focus of Flo Labs, we\'re excited to announce Flo Studios, a new creative agency within our company.</p><p><strong>Current Work Focus</strong></p>',
    link: 'https://www.youtube.com/@FlomadLabs',
    order: 8
  }
];

async function createProject(project) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ data: project });

    const options = {
      hostname: new URL(STRAPI_URL).hostname,
      path: '/api/projects',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✓ Created project: ${project.title}`);
          resolve(JSON.parse(data));
        } else {
          console.error(`✗ Failed to create ${project.title}: ${res.statusCode} - ${data}`);
          reject(new Error(`Failed: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Creating projects in Strapi...\n');

  for (const project of projects) {
    try {
      await createProject(project);
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error creating ${project.title}:`, error.message);
    }
  }

  console.log('\n✓ Projects created successfully!');
  console.log('\nNext steps:');
  console.log('1. Update Projects page to fetch from Strapi');
  console.log('2. Add project images to Strapi');
  console.log('3. Deploy frontend');
}

main().catch(console.error);
