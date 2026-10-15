import ModulePlaceholder from '@/components/ModulePlaceholder'

export default function LaporanPage() {
  return (
    <ModulePlaceholder
      title="Laporan"
      icon="📊"
      phase={6}
      permission="reports.view"
      description="Laporan keuangan, penjualan per sesi live, dan audit log aktivitas — khusus Owner."
      features={[
        'Laporan keuangan (pendapatan, DP, belum lunas)',
        'Penjualan per sesi live selling',
        'Audit log seluruh mutasi stok & aktivitas user',
        'Ekspor CSV untuk pembukuan',
      ]}
    />
  )
}
