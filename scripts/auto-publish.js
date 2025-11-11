import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = resolve(__dirname, '../src/content/blog');

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, content };
  }

  const frontmatterText = match[1];
  const bodyContent = content.slice(match[0].length);

  // Parse YAML-like frontmatter into an object
  const frontmatter = {};
  const lines = frontmatterText.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle boolean values
    if (value === 'true') value = true;
    if (value === 'false') value = false;

    // Remove quotes from strings
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    frontmatter[key] = value;
  }

  return { frontmatter, bodyContent };
}

/**
 * Convert frontmatter object back to YAML string
 */
function stringifyFrontmatter(frontmatter) {
  const lines = [];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value === null || value === undefined) continue;

    // Handle arrays (categories, tags)
    if (Array.isArray(value)) {
      const arrayStr = value.map(v => `"${v}"`).join(', ');
      lines.push(`${key}: [${arrayStr}]`);
    }
    // Handle booleans
    else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    }
    // Handle strings
    else if (typeof value === 'string') {
      lines.push(`${key}: "${value}"`);
    }
    // Handle other types
    else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Main function to auto-publish posts
 */
function autoPublishPosts() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  console.log(`\n🔍 Checking for posts to publish on ${today.toISOString().split('T')[0]}...\n`);

  const files = readdirSync(BLOG_DIR).filter(file => file.endsWith('.md'));
  let publishedCount = 0;

  for (const file of files) {
    const filePath = join(BLOG_DIR, file);
    const content = readFileSync(filePath, 'utf8');
    const { frontmatter, bodyContent } = parseFrontmatter(content);

    if (!frontmatter) {
      console.log(`⚠️  Skipping ${file} - no frontmatter found`);
      continue;
    }

    // Check if post is a draft
    if (frontmatter.draft !== true) {
      continue;
    }

    // Parse publish date
    const publishDate = new Date(frontmatter.publishDate);
    publishDate.setHours(0, 0, 0, 0);

    // Check if publish date has been reached
    if (publishDate <= today) {
      console.log(`✅ Publishing: ${file}`);
      console.log(`   Title: ${frontmatter.title || 'Untitled'}`);
      console.log(`   Publish Date: ${frontmatter.publishDate}`);

      // Update draft status
      frontmatter.draft = false;

      // Reconstruct the file content
      const newFrontmatter = stringifyFrontmatter(frontmatter);
      const newContent = `---\n${newFrontmatter}\n---${bodyContent}`;

      // Write the updated content back to the file
      writeFileSync(filePath, newContent, 'utf8');
      publishedCount++;
      console.log(`   ✨ Published successfully!\n`);
    }
  }

  if (publishedCount === 0) {
    console.log('📭 No posts ready to publish today.\n');
  } else {
    console.log(`\n🎉 Successfully published ${publishedCount} post${publishedCount === 1 ? '' : 's'}!\n`);
  }
}

// Run the script
try {
  autoPublishPosts();
} catch (error) {
  console.error('❌ Error during auto-publish:', error);
  process.exit(1);
}
