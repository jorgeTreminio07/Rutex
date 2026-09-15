import { ReportDetailView } from "@/features/reports/views/report-detail-view"

export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ReportDetailView reportId={slug} />
}