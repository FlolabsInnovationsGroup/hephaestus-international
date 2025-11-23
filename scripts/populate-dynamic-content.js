/**
 * Populate Strapi with dynamic content from frontend components
 * This includes: Benefits, Verticals, Methodology Items, Section Content, and Site Settings
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi-production-7ecb.up.railway.app';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

if (!STRAPI_API_TOKEN) {
  console.error('❌ Error: STRAPI_API_TOKEN environment variable is required');
  console.log('Usage: export STRAPI_API_TOKEN=your_token_here && node populate-dynamic-content.js');
  process.exit(1);
}

// Data from frontend components
const benefits = [
  {
    title: 'Flexibility',
    description: 'We offer you the flexibility you need to complete your tasks. We know you have a busy schedule and we offer you the ability to work at your own pace on your own time.',
    icon: 'Frame-8.jpg',
  },
  {
    title: 'Affordability',
    description: 'We can provide the learning experience needed for your success without breaking the bank.',
    icon: 'Frame-7.jpg',
  },
  {
    title: 'Opportunities',
    description: 'We focus on AI and robotic technologies because this is the future for humanity. The opportunities here will lead you to greater opportunities of the future. We want to see you succeed in creating better technology for the future.',
    icon: 'Frame-6.jpg',
  },
  {
    title: 'Expertise',
    description: 'Learn with us as we discover the latest trends in AI and robotics. We want you to learn and know the best technologies available as we improve the world around us technologically.',
    icon: 'Frame-9-1.jpg',
  },
];

const verticals = [
  {
    title: 'Education',
    description: 'Experiential learning through cutting-edge programs and internships that equip students with real-world skills to thrive in a global and dynamic economy.',
    icon: 'Frame-10.jpg',
    order: 1,
  },
  {
    title: 'Healthcare',
    description: 'Empowering healthcare innovation with AI-driven insights, advancing global well-being through smarter diagnostics and personalized care solutions.',
    icon: 'Mask-group-1-1-1024x360.jpg',
    order: 2,
  },
  {
    title: 'Travel',
    description: 'Revolutionizing travel with a personalized, AI-powered travel platform and chatbot that creates unforgettable experiences tailored to your unique journey.',
    icon: 'Mask-group-1024x360.jpg',
    order: 3,
  },
  {
    title: 'Space',
    description: 'Expanding the boundaries of innovation with AI solutions for space exploration, education, research, and sustainable development in the space sector.',
    icon: 'Mask-group-2-1024x360.jpg',
    order: 4,
  },
];

const methodologyItems = [
  {
    title: 'Recorded Meetings',
    description: 'We record and transcribe every meeting so you can easily review information when necessary.',
    order: 1,
    stepNumber: 1,
  },
  {
    title: 'Brainwriting Exercises',
    description: 'Brain writing is an exercise to help the brain get into a creative and productive state.',
    order: 2,
    stepNumber: 2,
  },
  {
    title: 'Advanced AI Tools',
    description: 'Language Learning Models (LLMs) help automate workflow, brainstorm and advise work production.',
    order: 3,
    stepNumber: 3,
  },
  {
    title: 'Industry Experts',
    description: 'Mentorship and guidance is provided through a variety of participants, advisors, and partners.',
    order: 4,
    stepNumber: 4,
  },
  {
    title: 'Hands-on Projects',
    description: 'We work on interesting AI projects that create a better future for humanity.',
    order: 5,
    stepNumber: 5,
  },
];

const sectionContent = [
  {
    identifier: 'hero-title',
    title: 'Hero Title',
    content: 'HEPHAESTUS R&D',
  },
  {
    identifier: 'hero-subtitle',
    title: 'Hero Subtitle',
    content: 'Advanced AI and Robotics Program',
  },
  {
    identifier: 'benefits-intro',
    title: 'Benefits Section Introduction',
    content: 'Our Benefits',
  },
  {
    identifier: 'verticals-intro',
    title: 'Verticals Section Introduction',
    content: 'We focus on four main verticals in our expertise.',
  },
  {
    identifier: 'methodology-title',
    title: 'Methodology Title',
    content: 'HELPING PEOPLE LEARN BETTER.',
  },
  {
    identifier: 'methodology-subtitle',
    title: 'Methodology Subtitle',
    content: 'Our methodology is to foster collaboration and creativity.',
  },
];

const siteSettings = {
  siteName: 'Hephaestus.International R&D',
  siteTagline: 'Advanced AI and Robotics Program',
  contactEmail: 'contact@hephaestus-international.com',
  contactPhone: '',
  footerText: 'A Flo Labs Company',
  copyrightText: '© 2025 Hephaestus.International. All rights reserved.',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/flomad-labs-r-d/',
    facebook: '',
    twitter: '',
    instagram: '',
  },
};

// Helper function to make API requests
async function apiRequest(endpoint, options = {}) {
  const url = `${STRAPI_URL}/api${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API request failed (${response.status}): ${error}`);
  }

  return response.json();
}

// Populate Benefits
async function populateBenefits() {
  console.log('\n📦 Populating Benefits...');
  
  for (const benefit of benefits) {
    try {
      await apiRequest('/benefits', {
        method: 'POST',
        body: JSON.stringify({ data: benefit }),
      });
      console.log(`✅ Created benefit: ${benefit.title}`);
    } catch (error) {
      console.error(`❌ Failed to create benefit "${benefit.title}":`, error.message);
    }
  }
}

// Populate Verticals
async function populateVerticals() {
  console.log('\n🏢 Populating Verticals...');
  
  for (const vertical of verticals) {
    try {
      await apiRequest('/verticals', {
        method: 'POST',
        body: JSON.stringify({ data: vertical }),
      });
      console.log(`✅ Created vertical: ${vertical.title}`);
    } catch (error) {
      console.error(`❌ Failed to create vertical "${vertical.title}":`, error.message);
    }
  }
}

// Populate Methodology Items
async function populateMethodologyItems() {
  console.log('\n🔬 Populating Methodology Items...');
  
  for (const item of methodologyItems) {
    try {
      await apiRequest('/methodology-items', {
        method: 'POST',
        body: JSON.stringify({ data: item }),
      });
      console.log(`✅ Created methodology item: ${item.title}`);
    } catch (error) {
      console.error(`❌ Failed to create methodology item "${item.title}":`, error.message);
    }
  }
}

// Populate Section Content
async function populateSectionContent() {
  console.log('\n📝 Populating Section Content...');
  
  for (const section of sectionContent) {
    try {
      await apiRequest('/section-contents', {
        method: 'POST',
        body: JSON.stringify({ data: section }),
      });
      console.log(`✅ Created section content: ${section.identifier}`);
    } catch (error) {
      console.error(`❌ Failed to create section content "${section.identifier}":`, error.message);
    }
  }
}

// Populate Site Settings (Single Type)
async function populateSiteSettings() {
  console.log('\n⚙️ Populating Site Settings...');
  
  try {
    await apiRequest('/site-setting', {
      method: 'PUT',
      body: JSON.stringify({ data: siteSettings }),
    });
    console.log('✅ Created/updated site settings');
  } catch (error) {
    console.error('❌ Failed to create/update site settings:', error.message);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Strapi content population...');
  console.log(`📡 Target: ${STRAPI_URL}`);
  
  try {
    await populateBenefits();
    await populateVerticals();
    await populateMethodologyItems();
    await populateSectionContent();
    await populateSiteSettings();
    
    console.log('\n✨ Content population complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Visit your Strapi admin panel to verify the data');
    console.log('2. Update frontend components to fetch from Strapi');
    console.log('3. Test the dynamic content on your website');
    console.log('\n💡 You can now edit all this content from the Strapi admin panel!');
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
