// ============================================================
// RUTEX - Limpiar archivos del Storage (carpeta "proforma")
//
// Uso:
//   node scripts/clean-proforma-storage.mjs        (pide confirmación)
//
// Lee NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y
// SUPABASE_STORAGE_BUCKET desde .env.local.
// ADVERTENCIA: la eliminación NO se puede deshacer.
// ============================================================

import { createClient } from "@supabase/supabase-js"
import { createInterface } from "node:readline"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const FOLDER = "proforma"
const BATCH = 1000

function loadEnv(file) {
  if (!existsSync(file)) return {}
  const env = {}
  for (const line of readFileSync(file, "utf-8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    let value = match[2].trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[match[1]] = value
  }
  return env
}

function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer) }))
}

async function listPaths(supabase, bucket, prefix, acc = []) {
  let offset = 0
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: BATCH,
      offset,
    })
    if (error) throw new Error(`Error listando ${prefix}: ${error.message}`)
    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.id) {
        acc.push(`${prefix}/${item.name}`)
      } else {
        await listPaths(supabase, bucket, `${prefix}/${item.name}`, acc)
      }
    }
    offset += data.length
  }
  return acc
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"))

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = env.SUPABASE_STORAGE_BUCKET

  if (!url || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local")
    process.exit(1)
  }
  if (!bucket) {
    console.error("Falta SUPABASE_STORAGE_BUCKET en .env.local")
    process.exit(1)
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

  console.log(`Bucket: ${bucket} · Carpeta: ${FOLDER} · Buscando archivos…`)
  const paths = await listPaths(supabase, bucket, FOLDER)

  if (paths.length === 0) {
    console.log("No hay archivos en la carpeta proforma. Nada que eliminar.")
    return
  }

  console.log(`Se eliminarán ${paths.length} archivo(s):`)
  for (const p of paths) console.log(`  - ${p}`)

  const answer = await ask(`Escribe "borrar" para confirmar: `)
  if (answer.trim().toLowerCase() !== "borrar") {
    console.log("Cancelado.")
    return
  }

  let deleted = 0
  for (let i = 0; i < paths.length; i += BATCH) {
    const chunk = paths.slice(i, i + BATCH)
    const { error } = await supabase.storage.from(bucket).remove(chunk)
    if (error) throw new Error(`Error eliminando: ${error.message}`)
    deleted += chunk.length
  }

  console.log(`Eliminados ${deleted} archivo(s) de la carpeta ${FOLDER}.`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})