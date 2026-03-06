# Blog Post: Building a Receipt Scanner App with Node.js

## Metadata
- **Title:** Building a Receipt Scanner App with Node.js (Auto-categorize expense photos)
- **Tags:** node, javascript, webdev, programming
- **Target keyword:** receipt scanner node.js, receipt scanner app, receipt data extraction node
- **Length:** ~1100 words
- **Status:** Ready to post

---

## Article Body

---

I needed to build a receipt scanner for an expense reporting tool. Requirements: drop a folder of receipt photos, get back a CSV with merchant, date, amount, and category.

Here's what I built — complete source included.

## What we're building

A Node.js CLI that:
1. Reads receipt images from a folder
2. Parses each one to extract structured data
3. Auto-categorizes by merchant type
4. Outputs a CSV for spreadsheet import

Total: ~80 lines of code.

## The parsing layer

I used [ParseFlow](https://parseflow-dashboard.vercel.app) — it handles JPEG, PNG, PDF, and WebP receipts in a single API call. Grab a free key (50 parses/month free, no credit card).

```bash
# No packages needed for the parsing step — just built-in fetch
# For CSV output: one package
npm install fast-csv
```

## Project structure

```
receipt-scanner/
├── scanner.js      ← main script
├── receipts/       ← drop images here
└── output.csv      ← generated report
```

## The full scanner (scanner.js)

```javascript
import { readdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { stringify } from 'fast-csv'

const API_KEY = process.env.PARSEFLOW_API_KEY
const API_URL = 'https://api-ebon-tau-30.vercel.app/v1/parse'
const RECEIPTS_DIR = './receipts'

// Category rules — extend as needed
const CATEGORY_MAP = {
  'whole foods': 'Groceries',
  'trader joe': 'Groceries',
  'safeway': 'Groceries',
  'uber eats': 'Meals',
  'doordash': 'Meals',
  'grubhub': 'Meals',
  'starbucks': 'Coffee',
  'blue bottle': 'Coffee',
  'lyft': 'Transport',
  'uber': 'Transport',
  'marriott': 'Lodging',
  'hilton': 'Lodging',
  'airbnb': 'Lodging',
  'aws': 'Software',
  'vercel': 'Software',
  'github': 'Software',
}

function categorize(vendor = '') {
  const v = vendor.toLowerCase()
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (v.includes(keyword)) return category
  }
  return 'Other'
}

async function parseReceipt(filePath) {
  const ext = filePath.split('.').pop().toLowerCase()
  const mimeTypes = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', pdf: 'application/pdf', webp: 'image/webp'
  }
  const mime = mimeTypes[ext] || 'application/octet-stream'

  const file = await readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([file], { type: mime }), filePath.split('/').pop())

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: form
  })

  if (!res.ok) throw new Error(`Parse failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function scan() {
  const files = await readdir(RECEIPTS_DIR)
  const imageFiles = files.filter(f =>
    /\.(jpg|jpeg|png|pdf|webp)$/i.test(f)
  )

  if (imageFiles.length === 0) {
    console.log('No receipt files found in ./receipts/')
    process.exit(0)
  }

  console.log(`Scanning ${imageFiles.length} receipts...`)

  const rows = []

  // Process with concurrency limit to avoid rate limits
  const CONCURRENCY = 3
  for (let i = 0; i < imageFiles.length; i += CONCURRENCY) {
    const batch = imageFiles.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(f => parseReceipt(join(RECEIPTS_DIR, f)))
    )

    for (let j = 0; j < batch.length; j++) {
      const filename = batch[j]
      const result = results[j]

      if (result.status === 'rejected') {
        console.error(`  ✗ ${filename}: ${result.reason.message}`)
        rows.push({ filename, vendor: 'ERROR', date: '', total: '', category: '', confidence: '' })
        continue
      }

      const data = result.value
      const category = categorize(data.vendor)
      console.log(`  ✓ ${filename}: ${data.vendor} — ${data.currency || 'USD'} ${data.total} (${category})`)

      rows.push({
        filename,
        vendor: data.vendor || '',
        date: data.date || '',
        total: data.total ?? '',
        currency: data.currency || 'USD',
        tax: data.tax ?? '',
        payment_method: data.payment_method || '',
        category,
        confidence: data.confidence,
      })
    }
  }

  // Write CSV
  const csvRows = [
    ['Filename', 'Vendor', 'Date', 'Total', 'Currency', 'Tax', 'Payment Method', 'Category', 'Confidence'],
    ...rows.map(r => [
      r.filename, r.vendor, r.date, r.total,
      r.currency, r.tax, r.payment_method, r.category, r.confidence
    ])
  ]

  await new Promise((resolve, reject) => {
    const chunks = []
    const stream = stringify(csvRows)
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('end', () =>
      writeFile('./output.csv', chunks.join('')).then(resolve).catch(reject)
    )
    stream.on('error', reject)
  })

  const total = rows.reduce((sum, r) => sum + (Number(r.total) || 0), 0)
  console.log(`\nDone. Total: $${total.toFixed(2)}`)
  console.log('Output: ./output.csv')
}

scan().catch(err => {
  console.error(err.message)
  process.exit(1)
})
```

## Run it

```bash
# Add receipts to the folder
cp ~/Downloads/*.jpg ./receipts/

# Set your API key
export PARSEFLOW_API_KEY=your_key_here

# Run
node scanner.js
```

Output:
```
Scanning 12 receipts...
  ✓ receipt-001.jpg: Whole Foods Market — USD 47.23 (Groceries)
  ✓ receipt-002.png: Starbucks — USD 6.85 (Coffee)
  ✓ receipt-003.jpg: Uber Eats — USD 31.50 (Meals)
  ✓ receipt-004.pdf: Marriott — USD 189.00 (Lodging)
  ...

Done. Total: $892.41
Output: ./output.csv
```

Open `output.csv` in Excel or Google Sheets — done.

## Extending it

**Add to an Express endpoint:**
```javascript
import express from 'express'
import multer from 'multer'

const app = express()
const upload = multer({ storage: multer.memoryStorage() })

app.post('/scan', upload.single('receipt'), async (req, res) => {
  const form = new FormData()
  form.append('file', new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname)

  const result = await fetch(API_URL, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY },
    body: form
  }).then(r => r.json())

  res.json({ ...result, category: categorize(result.vendor) })
})
```

**Watch a folder for new receipts:**
```javascript
import { watch } from 'fs'

watch('./receipts', async (event, filename) => {
  if (event === 'rename' && /\.(jpg|png|pdf)$/i.test(filename)) {
    const data = await parseReceipt(join('./receipts', filename))
    console.log(`New receipt: ${data.vendor} $${data.total}`)
    // → append to database, send Slack notification, whatever
  }
})
```

## Try without an API key

Hit the demo endpoint to see the response format:

```bash
curl "https://api-ebon-tau-30.vercel.app/v1/demo?scenario=receipt"
```

You'll get back a full parsed receipt JSON immediately.

## Get a free API key

[Register at parseflow-dashboard.vercel.app](https://parseflow-dashboard.vercel.app) — 50 free parses/month, no credit card.

---

*ParseFlow is open source (MIT). Issues and PRs welcome: github.com/NikitaDmitrieff/parseflow*
