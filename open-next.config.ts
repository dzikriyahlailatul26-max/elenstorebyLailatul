// open-next.config.ts — konfigurasi resmi @opennextjs/cloudflare
// Lihat: https://opennext.js.org/config
import { defineCloudflareConfig } from "@opennextjs/cloudflare"

export default defineCloudflareConfig({
  // OpenNext memakai incremental cache "dummy" (in-memory) bila tidak
  // dikonfigurasi. Untuk produksi, pertimbangkan R2 incremental cache
  // (lihat https://opennext.js.org/cloudflare/caching) — dijadwalkan
  // sebagai penyempurnaan pasca-Fase 1.
})
