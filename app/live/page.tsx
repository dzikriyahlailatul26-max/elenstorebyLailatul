import ModulePlaceholder from '@/components/ModulePlaceholder'

export default function LivePage() {
  return (
    <ModulePlaceholder
      title="Live Selling"
      icon="📡"
      phase={5}
      permission="orders.capture_live"
      description="Mode Host Live: grid stok real-time (Supabase Realtime) dan capture order langsung saat siaran dengan potong stok instan."
      features={[
        'Grid stok real-time (update <1 detik via Supabase Realtime)',
        'Form capture order cepat (SKU + qty + customer)',
        'Potong stok instan & atomic (anti-oversell)',
        'Sesi live: judul, durasi, total penjualan per siaran',
        'Tanpa tampilan harga modal & profit (data sensitif)',
      ]}
    />
  )
}
