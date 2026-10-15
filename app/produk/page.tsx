import ModulePlaceholder from '@/components/ModulePlaceholder'

export default function ProdukPage() {
  return (
    <ModulePlaceholder
      title="Produk"
      icon="🏷️"
      phase={3}
      permission="products.manage"
      description="CRUD produk & varian Lavie Pants (warna, ukuran, harga jual, harga modal, stok minimum)."
      features={[
        'Tambah / edit / hapus produk & varian',
        'Kelola harga jual & harga modal (tersembunyi dari Host Live)',
        'Alert stok menipis berdasarkan min_stock',
        'Gambar & kategori produk',
      ]}
    />
  )
}
