// Tipe database Supabase (deklarasi manual — bukan generated).
// Sumber kebenaran skema: supabase/migrations/0001_foundation.sql
// Diperlukan agar supabase.rpc() dan select() ter-type dengan benar.
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          email: string
          nama: string | null
          role: string
          aktif: boolean
          created_at: string
        }
        Insert: {
          email: string
          nama?: string | null
          role?: string
          aktif?: boolean
          created_at?: string
        }
        Update: {
          email?: string
          nama?: string | null
          role?: string
          aktif?: boolean
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          sku: string
          color: string
          size: string
          nama: string | null
          ready_stock: number
          po_reserved: number
          max_po: number
          harga_jual: number | null
          harga_modal: number | null
          min_stock: number | null
          kategori: string | null
          gambar: string | null
        }
        Insert: {
          id?: string
          sku: string
          color: string
          size: string
          nama?: string | null
          ready_stock?: number
          po_reserved?: number
          max_po?: number
          harga_jual?: number | null
          harga_modal?: number | null
          min_stock?: number | null
          kategori?: string | null
          gambar?: string | null
        }
        Update: {
          sku?: string
          color?: string
          size?: string
          nama?: string | null
          ready_stock?: number
          po_reserved?: number
          max_po?: number
          harga_jual?: number | null
          harga_modal?: number | null
          min_stock?: number | null
          kategori?: string | null
          gambar?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          id: string
          product_id: string
          type: string
          qty: number
          user_email: string
          catatan: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          type: string
          qty: number
          user_email: string
          catatan?: string | null
          created_at?: string
        }
        Update: {
          product_id?: string
          type?: string
          qty?: number
          user_email?: string
          catatan?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      stok_masuk: {
        Args: { p_sku: string; p_qty: number; p_user_email: string }
        Returns: null
      }
      stok_keluar: {
        Args: { p_sku: string; p_qty: number; p_user_email: string }
        Returns: number
      }
    }
  }
}

/** Varian produk Lavie Pants (Row dari tabel products) */
export type Product = Database['public']['Tables']['products']['Row']

/** Baris tabel transactions + relasi products saat select dengan join */
export type TransactionRow =
  Database['public']['Tables']['transactions']['Row'] & {
    products: { sku: string } | null
  }
