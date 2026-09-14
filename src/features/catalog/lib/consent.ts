export const PRIVACY_POLICY_VERSION = 1

const CONSENT_STORAGE_KEY = "rutex:catalog-consent"

interface StoredConsent {
  version: number
  acceptedAt: string
}

export function hasAcceptedConsent(): boolean {
  if (typeof window === "undefined") return false
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return false
    const parsed = JSON.parse(raw) as Partial<StoredConsent>
    return parsed.version === PRIVACY_POLICY_VERSION
  } catch {
    return false
  }
}

export function acceptConsent(): void {
  if (typeof window === "undefined") return
  const payload: StoredConsent = {
    version: PRIVACY_POLICY_VERSION,
    acceptedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload))
}