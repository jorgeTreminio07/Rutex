import { RouteDetailView } from "@/features/routes/views/route-detail-view"

export default async function RutaPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  return <RouteDetailView code={code} />
}