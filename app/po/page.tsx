import ModulePlaceholder from '@/components/ModulePlaceholder'

export default function PoPage() {
  return (
    <ModulePlaceholder
      title="Pre-Order (PO)"
      icon="🛒"
      phase={3}
      permission="po.manage"
      description="Kelola pesanan pre-order: reserve kuota PO, status pesanan, dan pelacakan deadline."
      features={[
        'Input pesanan PO baru (customer + item)',
        'Reserve kuota PO otomatis (po_reserved vs max_po)',
        'Update status: MENUNGGU → DIPROSES → SELESAI / BATAL',
        'Pelacakan DP & deadline',
        'Owner: monitoring read-only',
      ]}
    />
  )
}
