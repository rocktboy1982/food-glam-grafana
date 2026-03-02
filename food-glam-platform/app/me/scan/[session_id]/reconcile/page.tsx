import type { Metadata } from 'next'
import ScanReconcileClient from '@/components/pages/scan-reconcile-client'

export const metadata: Metadata = { title: 'Update Shopping List | Food Glam' }

export default function ScanReconcilePage({ params }: { params: { session_id: string } }) {
  return <ScanReconcileClient sessionId={params.session_id} />
}
