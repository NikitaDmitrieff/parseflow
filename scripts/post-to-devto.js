#!/usr/bin/env node
/**
 * post-to-devto.js
 *
 * Reads blog markdown files and publishes them to Dev.to via API.
 *
 * Usage:
 *   DEVTO_API_KEY=dev_xxx node scripts/post-to-devto.js
 *   DEVTO_API_KEY=dev_xxx node scripts/post-to-devto.js --dry-run
 *   DEVTO_API_KEY=dev_xxx node scripts/post-to-devto.js --file=path/to/post.md
 *
 * Blog post format expected (with a YAML-like header block):
 *   ## Metadata
 *   - **Title:** Post title here
 *   - **Tags:** node, javascript, api
 *   ...
 *   ## Article Body
 *   ---
 *   <article markdown here>
 */

import { readFile, readdir } from 'fs/promises'
import { join, resolve } from 'path'

const API_KEY = process.env.DEVTO_API_KEY
const DEVTO_API = 'https://dev.to/api/articles'
const BLOG_DIR = resolve('./docs/blog')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const FILE_ARG = args.find(a => a.startsWith('--file='))?.split('=')[1]

if (!API_KEY && !DRY_RUN) {
  console.error('Error: DEVTO_API_KEY environment variable is required.')
  console.error('Get your key at: dev.to → Settings → Extensions → API Keys')
  console.error('Then run: DEVTO_API_KEY=dev_xxx node scripts/post-to-devto.js')
  process.exit(1)
}

/**
 * Parse a blog markdown file into title, tags, and body.
 * Supports two formats:
 * 1. Auto-co docs/marketing/ format (## Metadata / ## Article Body)
 * 2. Standard frontmatter (---\ntitle: ...\n---)
 */
function parsePost(content, filename) {
  // Format 1: Auto-co marketing format
  const titleMatch = content.match(/[-*]\s*\*\*Title:\*\*\s*(.+)/i)
  const tagsMatch = content.match(/[-*]\s*\*\*Tags?:\*\*\s*(.+)/i)
  const bodyMatch = content.match(/##\s*Article Body\s*\n---\n([\s\S]+?)(?:\n---\n##|$)/i)

  if (titleMatch && bodyMatch) {
    const title = titleMatch[1].trim()
    const tags = tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
      : []
    const body = bodyMatch[1].trim()
    return { title, tags, body }
  }

  // Format 2: Standard YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]+?)\n---\n([\s\S]+)$/)
  if (fmMatch) {
    const fm = fmMatch[1]
    const body = fmMatch[2].trim()
    const title = (fm.match(/^title:\s*(.+)$/m) || [])[1]?.trim() || filename
    const tagsRaw = (fm.match(/^tags:\s*\[(.+)\]$/m) || [])[1] ||
                    (fm.match(/^tags:\s*(.+)$/m) || [])[1] || ''
    const tags = tagsRaw.split(',').map(t => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
    return { title, tags, body }
  }

  // Fallback: use H1 as title, full content as body
  const h1 = (content.match(/^#\s+(.+)$/m) || [])[1] || filename
  return { title: h1.trim(), tags: [], body: content }
}

async function publishPost(filePath, dryRun) {
  const content = await readFile(filePath, 'utf8')
  const filename = filePath.split('/').pop()
  const { title, tags, body } = parsePost(content, filename)

  if (!title || !body) {
    console.error(`  ✗ ${filename}: could not parse title or body`)
    return null
  }

  console.log(`\n[${dryRun ? 'DRY RUN' : 'POST'}] ${filename}`)
  console.log(`  Title: ${title}`)
  console.log(`  Tags:  ${tags.join(', ') || '(none)'}`)
  console.log(`  Body:  ${body.length} chars`)

  if (dryRun) {
    console.log('  → Skipped (dry run)')
    return { dry_run: true, title }
  }

  const payload = {
    article: {
      title,
      published: true,
      body_markdown: body,
      tags: tags.slice(0, 4), // Dev.to max 4 tags
    }
  }

  const res = await fetch(DEVTO_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const error = await res.text()
    console.error(`  ✗ Failed: ${res.status} — ${error}`)
    return null
  }

  const data = await res.json()
  console.log(`  ✓ Published: ${data.url}`)
  return data
}

async function main() {
  console.log(`Dev.to Publisher — ParseFlow`)
  console.log(`Blog directory: ${BLOG_DIR}`)
  if (DRY_RUN) console.log('Mode: DRY RUN (no posts will be published)')
  console.log('')

  let files

  if (FILE_ARG) {
    // Single file mode
    const resolvedPath = FILE_ARG.startsWith('/') ? FILE_ARG : resolve(FILE_ARG)
    files = [resolvedPath]
  } else {
    // Batch mode: all .md files in blog dir
    try {
      const entries = await readdir(BLOG_DIR)
      files = entries
        .filter(f => f.endsWith('.md'))
        .map(f => join(BLOG_DIR, f))
    } catch {
      // Fall back to marketing docs dir (auto-co format)
      const altDir = resolve('../auto-co/docs/marketing')
      console.log(`Blog dir not found. Trying: ${altDir}`)
      try {
        const entries = await readdir(altDir)
        files = entries
          .filter(f => f.endsWith('-blog.md'))
          .map(f => join(altDir, f))
      } catch {
        console.error(`No blog directory found. Create docs/blog/ or pass --file=path/to/post.md`)
        process.exit(1)
      }
    }
  }

  if (files.length === 0) {
    console.log('No markdown files found.')
    process.exit(0)
  }

  console.log(`Found ${files.length} file(s) to process.`)

  const results = []
  for (const file of files) {
    const result = await publishPost(file, DRY_RUN)
    results.push(result)
    // Rate limit: Dev.to allows ~10 req/min
    if (!DRY_RUN && files.length > 1) {
      await new Promise(r => setTimeout(r, 7000))
    }
  }

  const published = results.filter(Boolean).length
  const failed = results.filter(r => !r).length

  console.log(`\n--- Summary ---`)
  console.log(`Published: ${published}`)
  if (failed > 0) console.log(`Failed: ${failed}`)
  if (DRY_RUN) console.log('(Dry run — nothing was actually posted)')
}

main().catch(err => {
  console.error(err.message)
  process.exit(1)
})
