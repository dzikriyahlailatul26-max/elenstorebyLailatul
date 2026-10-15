import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Catatan: pola resmi OpenNext menyarankan `initOpenNextCloudflareForDev()`
// di file ini — TAPI fungsi itu menjalankan Miniflare/workerd (via
// getPlatformProxy) yang crash di Windows (access violation 0xc0000005),
// dan hanya diperlukan untuk Cloudflare bindings (R2/KV/DO).
// Aplikasi ini memakai Supabase (HTTP) tanpa bindings Cloudflare,
// jadi inisialisasi sengaja tidak dipanggil. Lihat docs/ARCHITECTURE.md §9.
