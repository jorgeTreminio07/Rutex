import { PrivacyConsentDialog } from "@/features/catalog/components/privacy-consent-dialog"

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PrivacyConsentDialog />
    </>
  )
}