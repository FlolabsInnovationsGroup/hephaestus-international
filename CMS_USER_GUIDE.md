# Strapi CMS User Guide for Content Editors

## Welcome to Your Content Management System!

This guide will help you manage content on the Hephaestus.International website using Strapi CMS. Don't worry - it's designed to be easy to use, even if you're not technical!

## 🔑 Logging In

1. Go to: <https://strapi-production-7ecb.up.railway.app/admin>
2. Enter your email and password
3. Click "Sign in"

**First time?** Your admin will create an account for you and send you credentials.

## 📊 Understanding the Dashboard

When you log in, you'll see the **Dashboard** with a sidebar menu on the left:

- **Content Manager** - Your content types (Internships, Blog Posts, Projects)
- **Media Library** - Your uploaded images and files  
- **Settings** - User management and configurations

## 📝 Managing Content

### Adding a New Internship Position

1. Click **"Content Manager"** in the sidebar
2. Click **"Internship"** collection
3. Click the **"Create new entry"** button (top right)
4. Fill out the form:
   - **Title**: e.g., "Software Development Intern"
   - **Slug**: e.g., "software-development-intern" (URL-friendly, lowercase, dashes)
   - **Description**: Full job description (use the rich text editor)
   - **Requirements**: What skills/qualifications needed (one per line)
   - **Responsibilities**: What they'll be doing (one per line)
   - **Category**: Choose from dropdown (Engineering, Marketing, etc.)
   - **Status**: "Open", "Closed", or "Filled"
   - **Duration**: e.g., "3-6 months"
   - **Location**: e.g., "Remote" or "Boston, MA"
   - **HubSpot Form ID**: Use `0133caf3-53e5-403f-a894-cd0246642913` (standard form)
5. Click **"Save"** (top right) or **"Save & Publish"**

### Editing an Existing Internship

1. Click **"Content Manager"** → **"Internship"**
2. Find the internship you want to edit (use search box if needed)
3. Click on the internship title
4. Make your changes
5. Click **"Save"** and **"Publish"**

### Deleting an Internship

1. Go to **"Content Manager"** → **"Internship"**
2. Find the internship
3. Click the **pencil icon** to edit
4. Click the **"Delete"** button in the top right
5. Confirm deletion

**Note**: Instead of deleting, consider setting Status to "Closed" or "Filled" to keep the record.

### Managing Blog Posts

#### Creating a New Blog Post

1. Click **"Blog Posts"** in sidebar
2. Click **"Create New"**
3. Fill out:
   - **Title**: Your blog post title
   - **Slug**: URL-friendly version (e.g., "our-new-ai-project")
   - **Author**: Your name
   - **Published Date**: When to publish (can schedule future posts)
   - **Featured Image**: Click to upload an image
   - **Content**: Write your blog post using the editor
   - **Category**: Optional category
   - **Tags**: Add relevant tags
   - **Status**: "Draft" (not visible) or "Published" (live on site)
4. Click **"Save"**

#### Using the Rich Text Editor

The rich text editor lets you format your content:

**Bold**: Select text and click **B** button  
*Italic*: Select text and click *I* button  
**Links**: Select text, click link icon, paste URL  
**Headings**: Use heading dropdown for H2, H3, etc.  
**Lists**: Click bullet or numbered list buttons  
**Images**: Click image icon to insert pictures  

**Pro Tip**: Write in a text editor first, then paste into the CMS!

### Managing Blog Posts

Blog posts appear in the `/blogs` section of the website.

1. In the **Content Manager**, click **"Blog Post"** collection
2. Click **"Create new entry"** button
3. Fill out required fields:
   - **Title**: Blog post title (e.g., "The Future of AI at Flo Labs")
   - **Slug**: URL-friendly version (auto-generated from title)
   - **Content**: Main blog content (use Markdown editor)
   - **Summary**: Short excerpt (150 chars) for blog listing page
   - **Featured Image**: Upload a header image (1200x630px recommended)
   - **Published Date**: Publication date
   - **Status**: Select "Published" or "Draft"
   - **Author** (if available): Select author name
4. Review the **SEO** section (Meta Title, Meta Description)
5. Click **"Save"** then **"Publish"** to make it live

**Note**: Only Published blog posts appear on the website. Drafts are hidden.

### Managing Projects

Projects appear in the "Our Projects" section on the homepage and `/projects` page.

1. In the **Content Manager**, click **"Project"** collection
2. Click **"Create new entry"** button
3. Fill out:
   - **Title**: Project name (e.g., "CAIPO")
   - **Description**: Brief description (2-3 sentences)
   - **Image**: Upload project image or logo
   - **Link**: URL to external project website (if applicable)
   - **Order**: Number to control display order (0 = first, 1 = second, etc.)
   - **Status**: "Active" or "Inactive"
4. Click **"Save"** then **"Publish"**

**Changing Order**: Edit the "Order" field - lower numbers appear first (0, 1, 2...).

## 🖼️ Managing Media (Images & Files)

### Uploading Images

1. Click **"Media Library"** in the main navigation
2. Click **"Add new assets"** button (or drag-and-drop files)
3. Select your image file(s) - you can upload multiple at once
4. Once uploaded, click on an image to edit details:
   - **Name**: Descriptive filename
   - **Alternative Text**: Describes image for accessibility (important for SEO!)
   - **Caption** (optional): Display caption
5. Click **"Save"**

### Best Practices for Images

- **File Size**: Keep under 1MB (compress large images first)
- **Format**: Use JPG for photos, PNG for graphics/logos
- **Dimensions**: 
  - Hero images: 1920x1080px
  - Project cards: 800x600px
  - Blog featured images: 1200x630px
- **Alt Text**: Describe what's in the image (helps blind users and SEO)

### Using Images in Content

When adding images to blog posts or other content:

1. Click the **image icon** in the editor
2. Choose "Upload New" or select from existing
3. Add alt text
4. Click "Insert"

## 🔍 Searching & Filtering

### Finding Content Quickly

Most collections have a **search box** at the top:

1. Type keyword (title, description, etc.)
2. Results filter automatically

### Using Filters

Many collections have filters:

- **Internships**: Filter by Category, Status
- **Blog Posts**: Filter by Status, Author
- Click the **filter icon** and select options

### Sorting

Click column headers to sort:
- **Title** - Alphabetical
- **Updated At** - Most recent
- **Status** - Published/Draft

## ⚙️ SEO Settings

Most content types have a "Meta" section for SEO:

### Meta Title
- **What it is**: Title that appears in Google search results
- **Length**: 50-60 characters
- **Example**: "Software Development Intern | Flo Labs"

### Meta Description
- **What it is**: Description that appears in Google
- **Length**: 150-160 characters
- **Example**: "Join Flo Labs as a Software Development Intern. Work on cutting-edge AI and robotics projects remotely. Apply today!"

**Pro Tip**: Always fill these out for better Google rankings!

## 👥 User Roles & Permissions

Strapi has built-in roles that control access:

### Super Admin
- Full access to all features
- Can manage users and permissions
- Can modify content types
- Can access all settings

### Author
- Can create, edit, and publish content
- Can upload and manage media
- Cannot modify other users' content
- Cannot access admin settings

### Editor
- Can create drafts only
- Cannot publish (requires approval from Author/Admin)
- Can upload media
- Limited access to settings

**Your role determines what you can see and do in the CMS.**

## 🚨 Common Tasks & Questions

### How do I schedule a blog post for later?

1. Set **Published Date** to your desired future date
2. Keep **Status** as "Draft"
3. When the date arrives, change Status to "Published"
4. Click **"Publish"**

*Note: Strapi doesn't auto-publish scheduled content. You'll need to manually publish on the scheduled date, or ask your developer about automation.*

### How do I feature an internship on the homepage?

1. Go to **Content Manager** → **Internship**
2. Click the internship you want to feature
3. Check the **"Featured"** checkbox
4. Click **"Save"** then **"Publish"**

### How do I change the order of projects?

Edit each project and adjust the **"Order"** field:

- Order 0 = displays first
- Order 1 = displays second
- Order 2 = displays third, etc.

Projects on the website automatically sort by this Order field (lowest to highest).

### I made a mistake! Can I undo?

Strapi doesn't have a built-in "undo" button, but you can:

- **Before publishing**: Simply edit the entry and fix the mistake
- **After publishing**: Edit the entry again and re-publish
- **Deleted content**: Contact your admin - they may be able to restore from database backup

**Best practice**: Always use "Draft" status while editing, review carefully, then publish.

### How do I know if my changes are live?

1. After clicking **"Publish"**, wait 60 seconds (the site revalidates every minute)
2. Open the website in a new browser tab: <https://flolabsfrontend.vercel.app>
3. Navigate to the page you changed
4. Look for your updates

**Note**: Due to 60-second ISR (Incremental Static Regeneration), changes take up to 1 minute to appear.

## 🎨 Content Style Guide

### Writing Internship Descriptions

**Good Example**:
```
Title: Machine Learning Engineering Intern
Description: Join our AI team to work on cutting-edge machine learning projects...

Requirements:
• Bachelor's degree in Computer Science or related field
• Experience with Python and TensorFlow
• Strong problem-solving skills

Responsibilities:
• Develop and train ML models
• Collaborate with senior engineers
• Document findings and results
```

**Tips**:
- Use clear, concise language
- Break up text with bullet points
- Include keywords for SEO (AI, machine learning, etc.)
- Proofread before publishing!

### Writing Blog Posts

- **Hook**: Start with an interesting fact or question
- **Subheadings**: Break up content with H2/H3 headings
- **Paragraphs**: Keep short (2-4 sentences)
- **Images**: Include relevant images every 2-3 paragraphs
- **Call-to-Action**: End with next steps (apply now, learn more, etc.)

## 🐛 Troubleshooting

### "I can't log in"

- Check your email and password are correct
- Try password reset link
- Contact your admin

### "My changes aren't showing"

- Did you click "Save" and then "Publish"?
- Is Status set to "Published" (not "Draft")?
- Wait 60 seconds for the site to revalidate
- Try hard refreshing the page:
  - **Windows/Linux**: Ctrl+F5 or Ctrl+Shift+R
  - **Mac**: Cmd+Shift+R
- Clear your browser cache:
  - **Chrome**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
  - **Firefox**: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
  - **Safari**: Cmd+Option+E (Mac)

### "I can't upload images"

- Check file size (under 5MB)
- Check file type (JPG, PNG, GIF only)
- Try a different browser

### "I accidentally deleted something"

- Contact your admin immediately
- They can restore from backup

## 💡 Tips for Success

1. **Save Often**: Click Save regularly while working
2. **Use Drafts**: Create as draft, review, then publish
3. **Preview**: Check how it looks before publishing
4. **SEO**: Always fill out meta title and description
5. **Images**: Optimize images before uploading
6. **Consistent**: Use same style/tone across content
7. **Ask**: Not sure? Ask your admin or developer!

## 📞 Getting Help

### Need Technical Help?

Contact: [Your Admin Email]

### Found a Bug?

Report it to: [Developer Email]

### Content Questions?

Check with: [Content Manager]

## 🎓 Video Tutorials (Coming Soon!)

We'll create video walkthroughs for:
- Creating your first internship posting
- Writing and publishing blog posts
- Managing media library
- SEO best practices

## 🔐 Security Best Practices

1. **Never share** your login credentials
2. **Use a strong password** (at least 12 characters)
3. **Log out** when done, especially on shared computers
4. **Report suspicious activity** to your admin immediately

---

## Quick Reference Card

### Daily Tasks

- **Add Internship**: Content Manager → Internship → Create new entry → Fill form → Save & Publish
- **Edit Internship**: Content Manager → Internship → Click entry → Edit → Save
- **Close Position**: Edit internship → Status: "Closed" → Save & Publish
- **Publish Blog**: Content Manager → Blog Post → Create new entry → Fill → Status: Published → Publish
- **Upload Image**: Media Library → Add new assets → Select file → Add alt text → Save

### Strapi Interface Tips

- **Search**: Use the search box at the top of any collection to find entries quickly
- **Filters**: Click the filter icon to narrow down results by status, category, etc.
- **Sort**: Click column headers to sort by Title, Date, Status
- **Bulk Actions**: Select multiple entries with checkboxes for bulk publish/unpublish/delete

### Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| **Save** | Ctrl+S | Cmd+S |
| **Bold text** | Ctrl+B | Cmd+B |
| **Italic text** | Ctrl+I | Cmd+I |
| **Refresh page** | Ctrl+R | Cmd+R |
| **Force refresh** | Ctrl+F5 | Cmd+Shift+R |

---

**Welcome to easier content management with Strapi! You've got this! 🚀**
