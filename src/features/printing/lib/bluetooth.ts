// Conexión con impresoras térmicas por Web Bluetooth (BLE).
// Nota: Web Bluetooth solo alcanza impresoras BLE (Bluetooth 4.0/5.0).
// Las de Bluetooth clásico (SPP) no son visibles desde ningún navegador.

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator
}

export interface ReceiptPrinter {
  id: string
  name: string
  write: (data: Uint8Array) => Promise<void>
  disconnect: () => void
}

export interface SavedPrinter {
  id: string
  name: string
}

// La impresora elegida se guarda para reconectarla en silencio en la próxima
// impresión. Chrome persiste el permiso por origen: requestDevice() con
// filters [{ id }] devuelve la impresora sin abrir el selector cuando el
// permiso ya está concedido; solo si ya no la encuentra (apagada, fuera de
// alcance o permiso revocado) hay que pedirla otra vez por el selector.
const SAVED_PRINTER_KEY = "rutex-receipt-printer"

export function saveReceiptPrinter(id: string, name: string): void {
  try {
    localStorage.setItem(SAVED_PRINTER_KEY, JSON.stringify({ id, name }))
  } catch {
    // sin storage disponible: ignorar
  }
}

export function getSavedReceiptPrinter(): SavedPrinter | null {
  try {
    const raw = localStorage.getItem(SAVED_PRINTER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SavedPrinter>
    return parsed && typeof parsed.id === "string" && parsed.id
      ? { id: parsed.id, name: parsed.name ?? "Impresora Bluetooth" }
      : null
  } catch {
    return null
  }
}

export function clearSavedReceiptPrinter(): void {
  try {
    localStorage.removeItem(SAVED_PRINTER_KEY)
  } catch {
    // ignorar
  }
}

function describeRequestError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  const name = error instanceof DOMException ? error.name : (error as { name?: string })?.name

  switch (name) {
    case "NotFoundError":
      return (
        "No se encontraron impresoras Bluetooth BLE cercanas, o cancelaste la selección. " +
        "Verifica que la HOIN esté encendida y cerca. Importante: solo aparecen impresoras BLE, " +
        "no las de Bluetooth clásico (SPP)."
      )
    case "SecurityError":
      return "El navegador denegó el Bluetooth (permiso bloqueado o conexión no segura). Revisa el candado de la barra de direcciones."
    case "NotAllowedError":
      return "Debes hacer clic en el botón para abrir la selección de impresoras: el Bluetooth requiere un gesto del usuario."
    default:
      return `No se pudo abrir la selección de impresoras. ${message && message !== "UnknownError" ? `Detalle: ${message}` : "Verifica que el Bluetooth de la PC esté activo."}`
  }
}

// Servicios BLE más usados por las impresoras térmicas esc/p0s baratas.
// Con acceptAllDevices, Chrome solo permite leer los servicios que se
// declaran aquí; si no se declaran, al conectar tira "Origin is not allowed
// to access any service".
const RECEIPT_SERVICES: BluetoothServiceUUID[] = [
  0x18f0, // eSSP / modo serie de muchas impresoras ESC/POS
  0xff00, // servicio genérico privado (muy común)
  0xff02, // característica de escritura del servicio 0xff00
  0x1101, // Serial Port Profile
  0x180a, // Device Information
]

export async function requestReceiptPrinter(): Promise<ReceiptPrinter> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "Este navegador no soporta Web Bluetooth. Usa Chrome o Edge (escritorio o móvil).",
    )
  }

  // Nota: NUNCA bloquear por getAvailability() — en Windows Chrome puede
  // reportar radio "no disponible" mientras el permiso de la página aún no
  // se ha concedido. Solamente requestDevice() dispara el permiso + el
  // selector de dispositivos.
  let device: BluetoothDevice
  try {
    device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: RECEIPT_SERVICES,
    })
  } catch (error) {
    throw new Error(describeRequestError(error))
  }

  return connectDevice(device)
}

// Reintenta conectar a la impresora guardada (getId del último emparejado).
// Como Chrome ya tiene el permiso concedido al origin para ese id, requestDevice
// con filters [{ id }] resuelve directo sin abrir el selector. Solo falla si la
// impresora está apagada, fuera de alcance o se revocó el permiso — en ese caso
// quien la llama decide abrir el selector otra vez.
export async function reconnectReceiptPrinter(id: string): Promise<ReceiptPrinter> {
  if (!isWebBluetoothSupported()) {
    throw new Error(
      "Este navegador no soporta Web Bluetooth. Usa Chrome o Edge (escritorio o móvil).",
    )
  }

  let device: BluetoothDevice
  try {
    // El filtro por `id` es una extensión de Chrome para reconectar a
    // dispositivos ya autorizados (no está en el tipo BluetoothLEScanFilter).
    device = await navigator.bluetooth.requestDevice({
      filters: [{ id }] as unknown as BluetoothLEScanFilter[],
      optionalServices: RECEIPT_SERVICES,
    })
  } catch (error) {
    throw new Error(describeRequestError(error))
  }

  return connectDevice(device)
}

async function connectDevice(device: BluetoothDevice): Promise<ReceiptPrinter> {
  if (!device.gatt) {
    throw new Error("El dispositivo no expone Bluetooth BLE.")
  }

  const server = await device.gatt.connect()
  const characteristic = await findWritableCharacteristic(server)

  if (!characteristic) {
    try {
      server.disconnect()
    } catch {
      // ignorar
    }
    throw new Error("La impresora no expone un canal de escritura BLE.")
  }

  return {
    id: device.id,
    name: device.name || "Impresora Bluetooth",
    write: (data) => writeChunked(characteristic, data),
    disconnect: () => {
      try {
        server.disconnect()
      } catch {
        // ignorar
      }
    },
  }
}

async function findWritableCharacteristic(
  server: BluetoothRemoteGATTServer,
): Promise<BluetoothRemoteGATTCharacteristic | null> {
  const visited = new Set<BluetoothRemoteGATTService>()
  const services: BluetoothRemoteGATTService[] = []

  for (const uuid of RECEIPT_SERVICES) {
    try {
      const found = await server.getPrimaryServices(uuid)
      for (const service of found) {
        if (!visited.has(service)) {
          visited.add(service)
          services.push(service)
        }
      }
    } catch {
      // servicio no presente en este dispositivo: ignorar
    }
  }

  try {
    const all = await server.getPrimaryServices()
    for (const service of all) {
      if (!visited.has(service)) {
        visited.add(service)
        services.push(service)
      }
    }
  } catch {
    // sin permiso para servicios no declarados: ignorar
  }

  for (const service of services) {
    let characteristics: BluetoothRemoteGATTCharacteristic[]
    try {
      characteristics = await service.getCharacteristics()
    } catch {
      continue
    }
    for (const characteristic of characteristics) {
      if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
        return characteristic
      }
    }
  }
  return null
}

async function writeOne(
  characteristic: BluetoothRemoteGATTCharacteristic,
  chunk: Uint8Array,
): Promise<void> {
  const payload = new Uint8Array(chunk)
  try {
    await characteristic.writeValueWithResponse(payload)
  } catch (error) {
    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(payload)
    } else {
      throw error
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Envía el ESC/POS por bloques (el BLE tiene límite de bytes por escritura).
// Intenta con bloques grandes y, si el dispositivo lo rechaza, cae a 20 bytes.
async function writeChunked(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array,
): Promise<void> {
  if (data.length === 0) return

  let chunkSize = 500
  try {
    await writeOne(characteristic, data.subarray(0, Math.min(500, data.length)))
  } catch {
    chunkSize = 20
  }

  for (let offset = chunkSize; offset < data.length; offset += chunkSize) {
    await writeOne(characteristic, data.subarray(offset, offset + chunkSize))
    await delay(5)
  }
}