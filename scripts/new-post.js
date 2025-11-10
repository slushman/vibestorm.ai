#!/usr/bin/env node

import { createInterface } from 'readline';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

async function createNewPost() {
  console.log('\n📝 Create a New Blog Post\n');

  // Get permalink
  const permalinkInput = await question('Permalink (e.g., "my-awesome-post"): ');
  const permalink = slugify(permalinkInput || 'untitled-post');

  rl.close();

  const publishDate = formatDate(new Date());

  // Create frontmatter with empty properties
  const frontmatter = `---
title: ""
description: ""
publishDate: ${publishDate}
categories: []
photographer: ""
account: ""
tags: []
draft: true
---

## Introduction

Start writing your post here...

## Main Content

Add your main content sections here.

## Conclusion

Wrap up your post here.
`;

  // Create paths
  const markdownPath = join(projectRoot, 'src', 'content', 'blog', `${permalink}.md`);
  const imagesDir = join(projectRoot, 'public', 'posts', permalink);

  // Check if post already exists
  if (existsSync(markdownPath)) {
    console.error(`\n❌ Error: A post with the permalink "${permalink}" already exists!`);
    process.exit(1);
  }

  // Create markdown file
  try {
    writeFileSync(markdownPath, frontmatter, 'utf8');
    console.log(`\n✅ Created markdown file: src/content/blog/${permalink}.md`);
  } catch (error) {
    console.error(`\n❌ Error creating markdown file: ${error.message}`);
    process.exit(1);
  }

  // Create images directory
  try {
    mkdirSync(imagesDir, { recursive: true });
    console.log(`✅ Created images directory: public/posts/${permalink}/`);
  } catch (error) {
    console.error(`\n❌ Error creating images directory: ${error.message}`);
    process.exit(1);
  }

  // Create README in images directory
  const readmeContent = `# Hero Image

Place your hero image in this folder with one of these names:
- hero.jpg
- hero.png
- hero.webp

The image will be automatically picked up by the blog post.

## Image Guidelines
- Recommended size: 1200x630px (or similar 1.91:1 ratio)
- Format: JPG, PNG, or WebP
- Keep file size under 500KB for optimal performance
`;

  console.log(`\n🎉 All done! Your new post is ready.`);
  console.log(`\n📍 Next steps:`);
  console.log(`   1. Add your hero image to: public/posts/${permalink}/hero.jpg`);
  console.log(`   2. Start writing in: src/content/blog/${permalink}.md`);
  console.log(`   3. Run 'npm run dev' to preview your post\n`);
}

createNewPost().catch(error => {
  console.error(`\n❌ Unexpected error: ${error.message}`);
  process.exit(1);
});
