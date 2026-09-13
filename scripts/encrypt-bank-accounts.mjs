// ============================================================
// RUTEX - Cifrar números de cuenta bancaria existentes
//
// Uso:
//   node scripts/encrypt-bank-accounts.mjs
//
// Lee NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y
// BANK_ACCOUNT_ENC_KEY desde .env.local. Cifra con AES-256-GCM
// (mismo formato que src/lib/encrypt.ts) los account_number que
// todavía estén en claro (sin prefijo "enc1:"). Idempotente: las
// filas ya cifradas se saltan.
//
// ADVERTENCIA: guarda una copia de BANK_ACCOUNT_ENC_KEY antes de
// ejecutar; si se pierde la clave, los números no se podrán recuperar.
// ============================================================

import { createClient } from "@supabase/supabase-js"
import { createCipheriv, randomBytes } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

const PREFIX = "enc1:"
const IV_LENGTH = 12
const TAG_LENGTH = 16
const BATCH = 100

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

function loadKey(env) {
  const raw = (env.BANK_ACCOUNT_ENC_KEY || "").trim().replace(/^0x/, "").toLowerCase()
  if (!/^[0-9a-f]{64}$/.test(raw)) {
    throw new Error("BANK_ACCOUNT_ENC_KEY no es válida (deben ser 64 caracteres hex) en .env.local")
  }
  return Buffer.from(raw, "hex")
}

function encryptValue(value, key) {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv("aes-256-gcm", key, iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${Buffer.concat([iv, tag, encrypted]).toString("base64")}`
}

async function main() {
  const env = loadEnv(resolve(process.cwd(), ".env.local"))

  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    console.error("Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en .env.local")
    process.exit(1)
  }
  const key = loadKey(env)

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

  console.log("Leyendo cuentas bancarias…")

  const { data: rows, error } = await supabase
    .from("bank_accounts")
    .select("id, account_number")
    .order("created_at", { ascending: true })

  if (error) throw new Error(`Error leyendo bank_accounts: ${error.message}`)

  const pending = (rows || []).filter((r) => r.account_number && !r.account_number.startsWith(PREFIX))
  console.log(`Total filas: ${(rows || []).length} · Pendientes de cifrar: ${pending.length}`)

  if (pending.length === 0) {
    console.log("Nada que cifrar. ¡Todo listo!")
    return
  }

  let updated = 0
  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH)
    for (const row of chunk) {
      const { error: upErr } = await supabase
        .from("bank_accounts")
        .update({ account_number: encryptValue(row.account_number, key) })
        .eq("id", row.id)
      if (upErr) throw new Error(`Error actualizando ${row.id}: ${upErr.message}`)
      updated++
    }
    console.log(`  … ${Math.min(i + BATCH, pending.length)}/${pending.length}`)
  }

  console.log(`Cifradas ${updated} cuenta(s) bancaria(s).`)
  console.log("Recuerda configurar la MISMA clave BANK_ACCOUNT_ENC_KEY en Vercel.")
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})