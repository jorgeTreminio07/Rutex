export const PRIVACY_LAST_UPDATED = "Septiembre 2026"

export interface PrivacyBlock {
  title: string
  lead?: string
  paragraphs?: string[]
  bullets?: string[]
}

export interface PrivacyPolicy {
  title: string
  subtitle: string
  highlight: string
  blocks: PrivacyBlock[]
}

export function getPrivacyPolicy(storeName?: string): PrivacyPolicy {
  const name = storeName?.trim() || "esta tienda"

  return {
    title: "Política de Privacidad",
    subtitle: `${name} — Protección y transparencia de tus datos`,
    highlight: `En **${name}** valoramos y respetamos profundamente tu privacidad. Nos comprometemos a mantener una total transparencia respecto al manejo de tu información.`,
    blocks: [
      {
        title: "1. Recopilación mínima de datos",
        lead:
          "Únicamente recopilamos la información estrictamente necesaria para poder procesar y coordinar la entrega de tus pedidos:",
        bullets: [
          "**Nombre completo** para identificar tu solicitud.",
          "**Número de teléfono** para ponernos en contacto contigo vía WhatsApp.",
          "**Detalle de los productos solicitados**, cantidades y monto total del pedido.",
          "**Modalidad de pago** elegida al confirmar tu solicitud.",
        ],
      },
      {
        title: "2. No compartimos tu información",
        paragraphs: [
          "**No vendemos, no alquilamos ni compartimos tus datos personales con terceros ni ninguna empresa externa bajo ninguna circunstancia.** Tus datos permanecen 100% confidenciales dentro de nuestra plataforma.",
        ],
      },
      {
        title: "3. Uso exclusivo del canal WhatsApp",
        paragraphs: [
          "El número de teléfono proporcionado se utiliza únicamente para coordinar la confirmación, facturación y estado de envío de la solicitud realizada. No realizamos spam ni comunicaciones no deseadas.",
        ],
      },
      {
        title: "4. Seguridad y retención",
        paragraphs: [
          "Tus solicitudes se almacenan de manera segura en nuestros servidores únicamente para fines de gestión de inventario, cartera y respaldo de facturación de compras. Puedes solicitar la eliminación de tu información en cualquier momento a través de nuestro canal oficial de soporte.",
        ],
      },
      {
        title: "5. Pagos sin riesgo",
        paragraphs: [
          "**No solicitamos números de tarjetas ni datos bancarios tuyos en la plataforma.** Los pagos se coordinan directamente a través de WhatsApp o mediante transferencia a las cuentas autorizadas que mostramos al finalizar tu pedido, garantizando que tu información financiera permanezca segura y fuera de nuestra aplicación.",
        ],
      },
    ],
  }
}