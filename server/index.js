import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data')
const SNAPSHOT_FILE = path.join(DATA_DIR, 'snapshot.json')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '2mb' }))

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function readSnapshot() {
  try {
    ensureDataDir()
    if (!fs.existsSync(SNAPSHOT_FILE)) return {}
    const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf8')
    return JSON.parse(raw || '{}')
  } catch {
    return {}
  }
}

function writeSnapshot(data) {
  ensureDataDir()
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(data, null, 2), 'utf8')
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() })
})

app.get('/sync', (_req, res) => {
  res.json(readSnapshot())
})

app.post('/sync', (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  const snapshot = {
    ...body,
    updatedAt: typeof body.updatedAt === 'number' ? body.updatedAt : Date.now(),
  }
  writeSnapshot(snapshot)
  res.json({ ok: true, updatedAt: snapshot.updatedAt })
})

app.post('/calculate', (_req, res) => {
  res.status(501).json({ error: 'calculate_client_side' })
})

app.listen(PORT, () => {
  ensureDataDir()
  console.log(`kar-hesap backend listening on :${PORT}`)
})
