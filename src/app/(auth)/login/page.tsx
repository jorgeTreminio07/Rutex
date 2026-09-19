import { LoginView } from "@/features/auth/views/login-view"
import { getPublicStoreIdentity } from "@/lib/server/store-identity"

export default async function LoginPage() {
  const { name, logoUrl } = await getPublicStoreIdentity()
  return <LoginView storeName={name} storeLogoUrl={logoUrl} />
}