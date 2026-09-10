// Encoder ESC/POS para impresoras térmicas (bluetooth BLE).
// Comandos básicos + texto en codepage CP850 (caracteres españoles).

export interface ReceiptBlock {
  text: string
  align?: "left" | "center" | "right"
  bold?: boolean
  double?: boolean
}

const ESC = 0x1b
const GS = 0x1d

function alignValue(align?: "left" | "center" | "right"): number {
  switch (align) {
    case "center":
      return 1
    case "right":
      return 2
    default:
      return 0
  }
}

// CP850 (ESC t 2) para letras con tilde, ñ, ¡ y ¿.
const CHAR_MAP: Record<string, number> = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ñ: 0xa4,
  ü: 0x81,
  Á: 0xb5,
  É: 0x90,
  Í: 0xd6,
  Ó: 0xe0,
  Ú: 0xe9,
  Ñ: 0xa5,
  Ü: 0x9a,
  "¡": 0xa6,
  "¿": 0xa8,
  "º": 0xa7,
  "ª": 0xab,
  "°": 0xf8,
  "—": 0x2d,
  "–": 0x2d,
  "“": 0x22,
  "”": 0x22,
  "‘": 0x27,
  "’": 0x27,
}

function encodeText(text: string): number[] {
  const out: number[] = []
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const mapped = CHAR_MAP[ch]
    if (mapped !== undefined) {
      out.push(mapped)
      continue
    }
    const code = text.charCodeAt(i)
    out.push(code < 0x80 ? code : 0x3f)
  }
  return out
}

export function encodeEscPos(blocks: ReceiptBlock[], charsPerLine = 48): Uint8Array {
  const out: number[] = [ESC, 0x40, ESC, 0x74, 0x02]

  let align = "left"
  let bold = false
  let double = false

  for (const block of blocks) {
    if (align !== block.align && block.align !== undefined) {
      align = block.align
      out.push(ESC, 0x61, alignValue(block.align))
    }
    if (bold !== Boolean(block.bold)) {
      bold = Boolean(block.bold)
      out.push(ESC, 0x45, bold ? 1 : 0)
    }
    if (double !== Boolean(block.double)) {
      double = Boolean(block.double)
      out.push(GS, 0x21, double ? 0x11 : 0x00)
    }
out.push(...encodeText(block.text).slice(0, block.double ? Math.floor(charsPerLine / 2) : charsPerLine), 0x0a)
  }

  // Avanza el papel y corta (la impresora ignora el corte si no tiene cuchilla).
  for (let i = 0; i < 5; i++) out.push(0x0a)
  out.push(GS, 0x56, 0x41)

  return Uint8Array.from(out)
}