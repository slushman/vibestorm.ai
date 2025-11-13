import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_DIR = resolve(__dirname, '../src/content/blog');

/**
 * Extract publish date and draft status from frontmatter
 */
function extractFrontmatterData(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { publishDate: null, isDraft: false };
  }

  const frontmatterText = match[1];

  // Extract publishDate
  const dateMatch = frontmatterText.match(/publishDate:\s*(\d{4}-\d{2}-\d{2})/);
  const publishDate = dateMatch ? dateMatch[1] : null;

  // Extract draft status
  const draftMatch = frontmatterText.match(/draft:\s*(true|false)/);
  const isDraft = draftMatch ? draftMatch[1] === 'true' : false;

  return { publishDate, isDraft };
}

/**
 * Get post title from frontmatter
 */
function extractTitle(content) {
  const titleMatch = content.match(/title:\s*"([^"]+)"/);
  return titleMatch ? titleMatch[1] : 'Untitled';
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
    const { publishDate, isDraft } = extractFrontmatterData(content);

    // Skip if not a draft
    if (!isDraft) {
      continue;
    }

    // Skip if no publish date found
    if (!publishDate) {
      console.log(`⚠️  Skipping ${file} - no publishDate found`);
      continue;
    }

    // Parse publish date
    const publishDateTime = new Date(publishDate);
    publishDateTime.setHours(0, 0, 0, 0);

    // Check if publish date has been reached
    if (publishDateTime <= today) {
      const title = extractTitle(content);
      console.log(`✅ Publishing: ${file}`);
      console.log(`   Title: ${title}`);
      console.log(`   Publish Date: ${publishDate}`);

      // Simply replace "draft: true" with "draft: false"
      // This preserves all formatting and doesn't mess with YAML structure
      const updatedContent = content.replace(/draft:\s*true/, 'draft: false');

      // Write the updated content back to the file
      writeFileSync(filePath, updatedContent, 'utf8');
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
