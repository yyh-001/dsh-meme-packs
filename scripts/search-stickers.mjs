import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const index = JSON.parse(readFileSync(join(root, 'stickers.json'), 'utf8'))
const query = process.argv.slice(2).join(' ').trim()
if (!query) {
  console.error('用法：node scripts/search-stickers.mjs <想表达的话>')
  process.exit(2)
}

const tokens = query.split(/[\s,，。！？、；;]+/).filter((token) => token.length >= 1)
const grams = []
for (let i = 0; i < query.length - 1; i++) {
  const gram = query.slice(i, i + 2)
  if (/\s/.test(gram)) continue
  grams.push(gram)
}

function score(sticker) {
  const blob = sticker.search || ''
  let points = 0
  if (blob.includes(query)) points += 8
  for (const token of tokens) {
    if (token !== query && blob.includes(token)) points += 3
    if (sticker.name && (sticker.name.includes(token) || token.includes(sticker.name))) points += 4
  }
  for (const keyword of sticker.keywords || []) {
    if (keyword && (query.includes(keyword) || blob.includes(keyword) && query.includes(keyword.slice(0, 2)))) {
      if (query.includes(keyword)) points += 5
    }
  }
  if (sticker.text && query.includes(sticker.text)) points += 6
  let gramHits = 0
  for (const gram of grams) {
    if (blob.includes(gram)) gramHits += 1
  }
  points += Math.min(gramHits, 8)
  if (sticker.tag && query.toLowerCase() === sticker.tag) points += 2
  return points
}

const hits = index.stickers
  .map((sticker) => ({ sticker, points: score(sticker) }))
  .filter((row) => row.points > 0)
  .sort((a, b) => b.points - a.points || a.sticker.name.localeCompare(b.sticker.name, 'zh'))
  .slice(0, 8)
  .map(({ sticker, points }) => ({
    points,
    pack: sticker.pack,
    name: sticker.name,
    tag: sticker.tag,
    description: sticker.description,
    text: sticker.text || '',
    useWhen: sticker.useWhen || [],
    imageUrl: sticker.imageUrl || null,
    path: sticker.path,
  }))

console.log(JSON.stringify(hits, null, 2))
