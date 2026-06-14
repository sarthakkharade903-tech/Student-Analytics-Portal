import { redirect } from 'next/navigation'

export default async function ClassFeeManagementPage({ params }: { params: Promise<{ classId: string }> }) {
  const unwrappedParams = await params
  redirect(`/dashboard/fee-management/${unwrappedParams.classId}/records`)
}
