// Conexión con impresoras térmicas por Web Bluetooth (BLE).
// Nota: Web Bluetooth solo alcanza impresoras BLE (Bluetooth 4.0/5.0).
// Las de Bluetooth clásico (SPP) no son visibles desde ningún navegador.

export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator
}

export interface ReceiptPrinter {
  name: string
  write: (data: Uint8Array) => Promise<void>
  disconnect: () => void
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
    device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true })
  } catch (error) {
    throw new Error(describeRequestError(error))
  }

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
  const services = await server.getPrimaryServices()
  for (const service of services) {
    const characteristics = await service.getCharacteristics()
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