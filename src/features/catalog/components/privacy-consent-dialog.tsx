"use client"

import { CheckCircle2, FileText, Lock, ShieldCheck } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/features/auth/store/use-auth-store"
import { useCatalog } from "@/features/catalog/hooks/use-catalog"
import {
  acceptConsent,
  hasAcceptedConsent,
} from "@/features/catalog/lib/consent"
import {
  getPrivacyPolicy,
  PRIVACY_LAST_UPDATED,
} from "@/features/catalog/lib/privacy-content"

function renderRich(text: string, keyPrefix: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={`${keyPrefix}-${i}`}>{part}</strong>
    ) : (
      <span key={`${keyPrefix}-${i}`}>{part}</span>
    ),
  )
}

export function PrivacyConsentDialog() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const { data } = useCatalog()
  const storeName = data?.store?.name
  const policy = useMemo(() => getPrivacyPolicy(storeName), [storeName])

  const [open, setOpen] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const consentedRef = useRef(false)

  useEffect(() => {
    if (!isHydrated) return
    let mounted = true
    Promise.resolve().then(() => {
      if (!mounted) return
      if (isAuthenticated || hasAcceptedConsent()) {
        setOpen(false)
      } else {
        consentedRef.current = false
        setOpen(true)
      }
    })
    return () => {
      mounted = false
    }
  }, [isHydrated, isAuthenticated])

  const handleAccept = () => {
    acceptConsent()
    consentedRef.current = true
    setAgreed(false)
    setOpen(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !consentedRef.current) {
      setOpen(true)
      return
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>{policy.title}</DialogTitle>
              <DialogDescription>{policy.subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[55dvh] space-y-4 overflow-y-auto pr-1 text-sm leading-relaxed">
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-muted-foreground">
            <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>{renderRich(policy.highlight, "hl")}</p>
          </div>

          <div className="space-y-4">
            {policy.blocks.map((block, i) => (
              <section key={i} className="space-y-1.5">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                  {block.title}
                </h3>
                {block.lead && (
                  <p className="pl-6 text-xs text-muted-foreground">
                    {block.lead}
                  </p>
                )}
                {block.paragraphs?.map((p, j) => (
                  <p key={j} className="pl-6 text-xs text-muted-foreground">
                    {renderRich(p, `p${i}-${j}`)}
                  </p>
                ))}
                {block.bullets && (
                  <ul className="ml-6 list-disc space-y-1 pl-3 text-xs text-muted-foreground">
                    {block.bullets.map((b, j) => (
                      <li key={j}>{renderRich(b, `b${i}-${j}`)}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-primary"
          />
          <span className="text-xs text-muted-foreground">
            He leído y acepto los <strong className="text-foreground">términos y
            condiciones</strong> y la <strong className="text-foreground">
            política de privacidad</strong> de {storeName ?? "la tienda"}.
          </span>
        </label>

        <DialogFooter showCloseButton={false}>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-4 text-primary" />
            Última actualización: {PRIVACY_LAST_UPDATED}
          </p>
          <Button type="button" disabled={!agreed} onClick={handleAccept}>
            Aceptar y continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}