import ModulePlaceholder from '@/components/ModulePlaceholder'

export default function PenjualanPage() {
  return (
    <ModulePlaceholder
      title="Penjualan & Keuangan"
      icon="💳"
      phase={4}
      permission="orders.manage"
      description="Pencatatan penjualan manual (non-live), pembayaran, dan data keuangan oleh Admin Pendataan."
      features={[
        'Input order manual (customer + item + total)',
        'Status pembayaran: BELUM_LUNAS → BAYAR',
        'Pencatatan keuangan & ringkasan pendapatan',
        'Pembatalan order (stok dikembalikan)',
      ]}
    />
  )
}
