import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let value = n
    for (let k = 0; k < 8; k++) value = (value & 1) ? (0xEDB88320 ^ (value >>> 1)) : (value >>> 1)
    table[n] = value
  }
  return table
})()

function crc32(buffer) {
  let value = -1
  for (let i = 0; i < buffer.length; i++) value = CRC_TABLE[(value ^ buffer[i]) & 0xFF] ^ (value >>> 8)
  return (value ^ -1) >>> 0
}

function zipStore(files) {
  const parts = []
  const central = []
  let offset = 0
  for (const file of files) {
    const nameBuffer = Buffer.from(file.name, 'utf8')
    const checksum = crc32(file.data)
    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0x0800, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt32LE(0, 10)
    localHeader.writeUInt32LE(checksum, 14)
    localHeader.writeUInt32LE(file.data.length, 18)
    localHeader.writeUInt32LE(file.data.length, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    parts.push(localHeader, nameBuffer, file.data)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0x0800, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt32LE(0, 12)
    centralHeader.writeUInt32LE(checksum, 16)
    centralHeader.writeUInt32LE(file.data.length, 20)
    centralHeader.writeUInt32LE(file.data.length, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt32LE(offset, 42)
    central.push(centralHeader, nameBuffer)
    offset += localHeader.length + nameBuffer.length + file.data.length
  }

  const centralSize = central.reduce((sum, part) => sum + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(files.length, 8)
  end.writeUInt16LE(files.length, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  return Buffer.concat([...parts, ...central, end])
}

function safeEntry(packRoot, entry) {
  const normalized = String(entry).replaceAll('\\', '/')
  if (!normalized || isAbsolute(normalized) || normalized.split('/').includes('..')) {
    throw new Error(`索引包含非法路径：${entry}`)
  }
  const fullPath = resolve(packRoot, normalized)
  if (fullPath !== packRoot && !fullPath.startsWith(packRoot + sep)) {
    throw new Error(`索引路径越界：${entry}`)
  }
  return { name: normalized, fullPath }
}

const [sourceArgument, outputArgument] = process.argv.slice(2)
if (!sourceArgument || !outputArgument) {
  console.error('用法：node scripts/build-pack.mjs <图库目录> <输出.zip>')
  process.exit(2)
}

const packRoot = resolve(sourceArgument)
const outputPath = resolve(outputArgument)
const indexPath = join(packRoot, 'index.db')
const manifestPath = join(packRoot, 'manifest.json')
if (!existsSync(indexPath)) throw new Error(`找不到 ${indexPath}`)
if (!existsSync(manifestPath)) throw new Error(`找不到 ${manifestPath}`)

const database = new DatabaseSync(indexPath, { readOnly: true })
const rows = database.prepare('SELECT path FROM memes ORDER BY path').all()
database.close()

const files = [
  { name: 'index.db', data: readFileSync(indexPath) },
  { name: 'manifest.json', data: readFileSync(manifestPath) },
]
const seen = new Set(files.map((file) => file.name))
for (const row of rows) {
  const entry = safeEntry(packRoot, row.path)
  if (seen.has(entry.name)) continue
  if (!existsSync(entry.fullPath)) throw new Error(`索引图片不存在：${entry.name}`)
  seen.add(entry.name)
  files.push({ name: entry.name, data: readFileSync(entry.fullPath) })
}

const zip = zipStore(files)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, zip)
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
console.log(JSON.stringify({
  id: manifest.id || basename(packRoot),
  name: manifest.name || basename(packRoot),
  version: manifest.version || '',
  memes: rows.length,
  files: files.length,
  bytes: zip.length,
  sha256: createHash('sha256').update(zip).digest('hex'),
  output: relative(process.cwd(), outputPath).replaceAll('\\', '/'),
}, null, 2))
