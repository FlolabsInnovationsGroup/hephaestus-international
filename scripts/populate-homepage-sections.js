#!/usr/bin/env node

/**
 * Populate Homepage Content Sections in Strapi
 * 
 * This script creates the editable content sections for homepage sections:
 * - Get Recruited
 * - Ambitious Projects  
 * - Long Live Learning
 * 
 * Run with: export STRAPI_API_TOKEN=<your-token> && node populate-homepage-sections.js
 */

const STRAPI_URL = process.env.STRAPI_URL || 'https://strapi-production-7ecb.up.railway.app'
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN

if (!STRAPI_API_TOKEN) {
  console.error('❌ Error: STRAPI_API_TOKEN environment variable is required')
  console.log('Usage: export STRAPI_API_TOKEN=<your-token> && node populate-homepage-sections.js')
  process.exit(1)
}

// Homepage content sections
const homepageSections = [
  {
    identifier: 'get-recruited-title',
    title: 'Get Recruited Today',
    content: 'Get Recruited Today',
    subtitle: null
  },
  {
    identifier: 'get-recruited-content',
    title: 'Get Recruited Content',
    content: '<p>Join the Hephaestus family and kickstart your career in AI and robotic technologies. We are on a mission to bring the world together with the latest trends in AI and robotics. We are looking for individuals who are hungry for more growth in their experience and knowledge. Gain the experience you desire by applying with us on the programs page.</p>',
    subtitle: null
  },
  {
    identifier: 'ambitious-projects-title',
    title: 'Ambitious Innovative Projects',
    content: 'Ambitious Innovative Projects',
    subtitle: null
  },
  {
    identifier: 'ambitious-projects-content',
    title: 'Ambitious Projects Content',
    content: '<p>Enjoy collaborating with other thoughtful <strong>professionals</strong> that are passionate about bringing a vision to life! We offer experiential learning, a unique and immersive educational training program with hands-on, real world <strong>experience</strong>.</p><p><strong>Hephaestus R&D</strong> is an incubator launching innovative projects in AI and Robotics. We enhance learning and project outcomes through teamwork, idea sharing, and innovative methods like brainstorming and LLM automation, preparing students with practical skills.</p>',
    subtitle: null
  },
  {
    identifier: 'long-live-learning-title',
    title: 'Long Live Learning',
    content: 'Long Live Learning',
    subtitle: null
  },
  {
    identifier: 'long-live-learning-content',
    title: 'Long Live Learning Content',
    content: '<p>Learn about the latest trends in technology. We are learning about the future of <strong>AI, robotics, education,</strong> and so much more. Every day is a great day to learn and we want to continuously learn and we expand.</p><p><strong>Hephaestus</strong> wants to prepare you for your own journey in your career. We help you learn the way you want to learn so you can achieve your goals of getting to the next level.</p>',
    subtitle: null
  }
]

async function createSectionContent(section) {
  try {
    const response = await fetch(`${STRAPI_URL}/api/section-contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STRAPI_API_TOKEN}`
      },
      body: JSON.stringify({
        data: section
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(JSON.stringify(error))
    }

    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
}

async function main() {
  console.log('🚀 Starting homepage sections population...\n')

  let successCount = 0
  let errorCount = 0

  for (const section of homepageSections) {
    try {
      console.log(`Creating section: ${section.identifier}...`)
      await createSectionContent(section)
      console.log(`✅ Successfully created: ${section.identifier}`)
      successCount++
    } catch (error) {
      console.log(`⚠️  Error creating ${section.identifier}:`, error.message)
      // Check if it's a duplicate error
      if (error.message.includes('already exists') || error.message.includes('unique')) {
        console.log(`   ℹ️  Section already exists, skipping...`)
      }
      errorCount++
    }
    console.log('')
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Summary:')
  console.log(`   ✅ Successfully created: ${successCount}`)
  console.log(`   ⚠️  Errors/Skipped: ${errorCount}`)
  console.log('='.repeat(50))
  console.log('\n✨ Homepage sections population complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Visit your Strapi admin: ' + STRAPI_URL + '/admin')
  console.log('   2. Go to Content Manager → Section Content')
  console.log('   3. Edit the homepage sections as needed')
  console.log('   4. Changes will appear on the website within 60 seconds')
}

main()
