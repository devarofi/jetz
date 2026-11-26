# Audit Jetz — Celah Bug, Kelemahan & Kebocoran Memori

> Tanggal audit: 2025-11-25 · Ruang lingkup: `packages/jetz/src` (jetz.js 3.952 baris,
> jetz-ui.js, jetz-router.js, jetz-session.js, middleware.js, jetz-devtools.js) + harness uji.
> Metode: pembacaan kode menyeluruh + 12 probe runtime yang dieksekusi (jsdom), lalu dibersihkan.
> Baseline saat audit: **392 unit test lulus**, **suite memori 105/105 lulus**.

## Ringkasan eksekutif

| Kategori | Jumlah |
|---|---|
| Bug terbukti secara runtime (dieksekusi & terekam) | 7 (#1–#7) |
| Bug API / konsistensi terbukti | 3 (#8–#10) |
| Kebocoran / pemborosan memori | 6 (#11–#16) |
| Catatan permukaan keamanan (residual) | 2 (dokumentasi) |

**Verdict:** arsitektur dan disiplin memorinya sudah di level *mature/tinggi* — konsep yang
dipakai (fine-grained signals, disposal scope per render, keyed reconciliation dengan LIS,
batching, suite heap/GC sendiri dengan WeakRef + FinalizationRegistry) adalah standar framework
generasi terbaru. Namun implementasinya belum "paling tinggi" secara keseluruhan: invalidasi
masih *global sweep* (bukan dependensi-driven), tidak ada guard re-entransi/siklus, notifikasi
tanpa isolasi error, dan ada 7 bug terbukti pada jalur inti.

---

## 1. Bug terbukti secara runtime

### #1 — Akumulasi subscription tak terbatas pada list `asRemember()` · Tinggi
**Lokasi:** `jetz.js` — `subscribeRememberedValues()`, `ListState.#prepareRememberedItem()`
**Bukti probe:** `1 → 51 subscriber` setelah 50× `list.set(rows)` dengan row instance yang sama.
Setiap `set()/push()/transform()` memanggil `subscribeRememberedValues()` ulang tanpa dedup
lintas-panggilan, sehingga tiap perubahan row memicu N× `#persistRemembered` (masing-masing
JSON parse + stringify seluruh storage) — biaya O(n²) plus retensi closure.

### #2 — Rekursi tak berujung `onUpdate` → stack overflow · Tinggi
**Lokasi:** `jetz.js` — `Jetz.#sweepLifecycles()`, `LifecycleContext.runUpdate()`
**Bukti probe:** `271 frame → RangeError: Maximum call stack size exceeded` ketika `onUpdate`
menulis state. Sweep menjalankan `onUpdate` untuk semua komponen hidup di setiap perubahan
state tanpa guard re-entransi; tulis-di-onUpdate memicu sweep lagi, tanpa batas.

### #3 — Satu subscriber yang melempar error memutus subscriber lain · Tinggi
**Lokasi:** `jetz.js` — `State.#notify()`
**Bukti probe:** `computed` yang berlangganan state **tidak pernah recompute** (nilai basi
`"x!"`, seharusnya `"y!"`) hanya karena subscriber lain yang terdaftar duluan melempar.
`#notify()` memakai `forEach` tanpa isolasi error per-subscriber — semua binding/computed
setelahnya diam-diam beku.

### #4 — Keyed reconciliation rusak oleh duplikat key → baris data hilang di UI · Tinggi
**Lokasi:** `jetz.js` — `ListState.#planOrder()`, jalur fallback `renderView()`
**Bukti probe:** 3 item dengan key duplikat → setelah refresh keyed hanya **2 baris tersisa**
(satu item tanpa representasi DOM, satu view yatim tertinggal). `#planOrder` mendeteksi
duplikat lalu `return null`, tetapi jalur fallback menjatuhkan/menggandakan view.

### #5 — Crash stack overflow pada list besar (≥ ±100k item) · Tinggi
**Lokasi:** `jetz.js` — `ListState.#syncArray()`, konstruktor `ListState`
**Bukti probe:** `listOf(...150k)` + `set()` → `RangeError: Maximum call stack size exceeded`.
`#syncArray()` melakukan `super.splice(0, n, ...values)` (menyebarkan semua argumen) dan
konstruktor memakai spread — batas jumlah argumen V8 tercapai.
**Catatan:** spread di *call site* pengguna (`listOf(...arrRaksasa)`) adalah batas API
rest-args yang tidak bisa dihilangkan dari dalam; jalur internal diperbaiki agar tidak ada
crash dari framework-nya sendiri.

### #6 — Komponen di dalam cabang `ifElse()` kehilangan seluruh lifecycle · Tinggi
**Lokasi:** `jetz.js` — `IfElse.#resolveBranch()`
**Bukti probe:** `onMount`/`onDestroy` function component **tidak pernah terpanggil** (hook
diabaikan dengan warning "called outside of a component render"); class component
`onCreate`/`onMount` **tidak pernah jalan**. `#resolveBranch()` memanggil `result.render()` /
`result.call()` langsung, melewati `renderComponent()` — timer/fetch di `onMount` tidak pernah
dibersihkan.

### #7 — Hook lifecycle di root component `Jetz.mount(App)` diabaikan · Tinggi
**Lokasi:** `jetz.js` — `Jetz.mount()`, `useLifecycle()`
**Bukti probe:** pola bootstrap yang didokumentasikan (`Jetz.mount(App, "#app")`) →
`onMount`/`onDestroy` di App **tidak pernah terpanggil** (`calls=[]`). Root dipanggil polos
tanpa `LifecycleContext`; `useLifecycle()` hanya `console.warn` lalu mengabaikan. Mount
instance class sebagai root juga melempar (dipanggil tanpa `new`).

---

## 2. Bug API / konsistensi

### #8 — Router: navigasi ke URL yang sama adalah no-op senyap · Sedang
**Lokasi:** `jetz-router.js` — `#fallbackNavigateListener()` (dedup `#lastListenerUrl`)
**Bukti probe:** `to('/users', {page:2})` setelah `to('/users', {page:1})` **dibuang** —
parameter baru tidak pernah sampai ke komponen; "refresh rute aktif" juga mustahil. Dedup
berbasis URL yang dimaksudkan untuk menyerap pengiriman ganda (popstate + hashchange) ikut
menelan navigasi baru yang sah.

### #9 — `set()/transform()/sort()` tidak memicu re-evaluasi kondisional · Sedang
**Lokasi:** `jetz.js` — `ListState.#bump()`, `#commitValues()`
**Bukti probe:** `ifElse(() => list.size > 1, …)` tetap menampilkan cabang lama setelah
`list.set([1])`. `#bump()` no-op jika sinyal `version` belum pernah dibaca; `removeAt()`/
`insertAt()` sadar akan ini (memanggil `triggerByState()` eksplisit) tapi API lain tidak —
inkonsisten.

### #10 — Handler kustom `stateOf(v, handler)` adalah dead code · Sedang
**Lokasi:** `jetz.js` — `State.get value`, `stateOf()` optDefaultProxy
**Bukti probe:** `get` kustom (mengembalikan `999`) **diabaikan** (nilai tetap `5`), `set`
kustom **tidak pernah dipanggil** (0 kali). API menerima parameter handler tapi perilakunya
tidak pernah dijalankan.

---

## 3. Kebocoran / pemborosan memori

### #11 — Leak subscription `css()` saat urutan bagian bergeser · Sedang
**Lokasi:** `jetz.js` — `JetzElement.#bindClassParts()`
**Bukti probe:** subscriber state kelas **1 → 3** setelah 2× rebind dengan posisi bergeser.
Kondisi reuse berbasis indeks; unsubscribe hanya menyentuh part yang benar-benar hilang dari
array, sehingga part yang berpindah indeks menggandakan subscription (callback compose lama
tetap hidup, memicu recompute berulang dan menahan elemen).

### #12 — Identitas row `asRemember()` berubah tiap mutasi · Sedang
**Lokasi:** `jetz.js` — `hydrateRememberedItem()`, `ListState.#prepareRememberedItem()`
**Bukti probe:** `transform(r => r)` mengganti row dengan objek state baru
(`identity kept = false`) — referensi yang dipegang user/UI menjadi basi, subscription lama
menumpuk di row lama sebelum dilepas.

### #13 — `RememberState`: parse + stringify seluruh storage di setiap tulis · Sedang
**Lokasi:** `jetz.js` — `_RememberStateTemp.assignCollectionValue()`
Setiap penulisan state membaca ulang dan `JSON.parse` seluruh blob localStorage — O(total)
per ketikan pada field yang di-remember; `rememberCollections` tidak pernah dipangkas.

### #14 — Router tidak punya `destroy()` · Rendah
**Lokasi:** `jetz-router.js` — `#initialNavigateListener()`
Listener `popstate`/`hashchange`/`navigate` di `window` menutup over `Router` selamanya;
membuat Router baru (tes, micro-frontend) menumpuk listener + entry `sessionStorage` per rute.

### #15 — Loop flush batch tanpa guard sirkular · Rendah
**Lokasi:** `jetz.js` — `flushBatch()`
Mengulang selama antrian tidak kosong tanpa batas iterasi — effect/computed yang menulis
dependensinya sendiri di dalam `batch()` menggantung selamanya (framework besar punya guard
"potential infinite loop").

### #16 — `element.remove()` tidak melakukan teardown · Rendah
**Lokasi:** `jetz.js` — `JetzElement.remove()`, `AttrSpecial.hide()`
Terminologi sudah didokumentasikan, tapi konsekuensinya: elemen yang dibuang via `remove()`
tetap terdaftar di registry statis `remountByAttr` (akar kuat) dan kena sweep di setiap state
change; subscription elemen tetap hidup. Jalur internal `_if`/`_else` (hide/show) sengaja
menjaga binding — itu harus dipisah dari `remove()` publik.

---

## 4. Permukaan keamanan (XSS / injeksi)

**Sudah baik:**
- Nilai state yang terikat ke elemen/atribut lewat `textContent`/`setAttribute` (injeksi HTML
  via string state sudah ditutup).
- URL berbahaya (`javascript:`, `vbscript:`, `data:text/html`) diblokir, termasuk variasi
  whitespace/control-char (`java\tscript:`).
- `on*` hanya menerima fungsi (string handler diabaikan).
- Guard prototype-pollution `__proto__` di `stateOf`/`mergeObject`/`JetzSession.set`.

**Residual risk (diterima / diperbaiki sebagian):**
- `html()`/`Raw` tetap innerHTML mentah — *by-design*, tanpa sanitasi; bahaya bila menyentuh
  input user (dokumentasikan sebagai tanggung jawab pemakai).
- `data:image/svg+xml` pada atribut `data`/`src` `<object>`/`<embed>` lolos filter skema —
  mitigasi: `data:` URI bersifat *opaque origin* (bukan XSS same-origin), risiko terbatas.
- Daftar nilai atribut (`srcset`, `ping`) berisi banyak URL — pola filter yang berlabuh di
  awal string (`^`) bisa dilewati oleh URL berbahaya di entri ke-2 dst.

---

## 5. Skala penerapan ("apakah sudah paling tinggi?")

| Aspek | Penilaian |
|---|---|
| Konsep reaktivitas (signal, computed, effect, watch, lazy, untrack, batch) | Tinggi |
| Manajemen memori (disposal scope, teardown deterministik, harness GC sendiri) | Baik — ada celah #1, #11–#13 |
| Ketahanan (robustness) | Sedang — #2, #3, #15 |
| Skalabilitas data besar | Sedang-rendah — #5, sweep global per state change |
| Keamanan XSS | Baik |
| Kualitas harness uji (392 unit + 105 memory assertions) | Sangat baik |

**Yang sudah setara framework top:** signal auto-tracked, disposal scope per render (loop item /
ifElse branch / komponen), keyed reconciliation dengan LIS (pergeseran DOM minimal — langka
bahkan di framework besar), batching, shallow-row proxy untuk tabel besar, teardown
terdeterministik, suite heap/GC dengan WeakRef + FinalizationRegistry.

**Yang membuatnya belum "paling tinggi":**
1. Invalidasi masih *global sweep* — setiap `setState` memicu semua `_if`/`ifElse`/`listen`
   dan `onUpdate` seluruh aplikasi, bukan dependensi-driven seperti Solid/Vue.
2. Tidak ada guard re-entransi/siklus (#2, #15).
3. Notifikasi tanpa isolasi error (#3).
4. Belum ada SSR/hydration, dev double-invoke, atau teardown eksplisit untuk router.
5. Tujuh bug terbukti pada jalur inti (sebelum perbaikan di bawah).

---

## 6. Status perbaikan

Dikerjakan berurutan prioritas **rendah → sedang → tinggi**.

| # | Perbaikan | Prioritas | Status |
|---|---|---|---|
| #14 | `Router.destroy()` melepas listener `window` | Rendah | ✅ selesai |
| #15 | Guard batas iterasi `flushBatch()` (anti-gantung) | Rendah | ✅ selesai |
| #16 | `remove()` = teardown lengkap; jalur internal `_if`/`_else` memakai detach node mentah | Rendah | ✅ selesai |
| #8 | Navigasi berulang ke URL sama didukung (dedup hanya untuk pengiriman ganda) | Sedang | ✅ selesai |
| #9 | Semua mutasi `ListState` memicu re-evaluasi kondisional secara konsisten | Sedang | ✅ selesai |
| #10 | Handler `stateOf(v, handler)` get/set benar-benar dijalankan | Sedang | ✅ selesai |
| #11 | `#bindClassParts` tidak menggandakan subscription saat part bergeser | Sedang | ✅ selesai |
| #12 | Identitas row `asRemember()` stabil (tanpa re-hydrate) | Sedang | ✅ selesai |
| #13 | `RememberState` menulis tanpa parse ulang storage | Sedang | ✅ selesai |
| #1 | Dedup subscription `asRemember()` per list (row & nested) | Tinggi | ✅ selesai |
| #2 | Guard re-entransi `onUpdate` + batas kedalaman `triggerByState` | Tinggi | ✅ selesai |
| #3 | Isolasi error per subscriber/container di `State.#notify` | Tinggi | ✅ selesai |
| #4 | Keyed reconciliation tahan duplikat key (degradasi aman, tanpa baris hilang) | Tinggi | ✅ selesai |
| #5 | `#syncArray` & jalur internal tanpa spread (list 150k aman) | Tinggi | ✅ selesai |
| #6 | Komponen di cabang `ifElse()` mendapat lifecycle penuh via `renderComponent()` | Tinggi | ✅ selesai |
| #7 | Root component `Jetz.mount()` mendapat lifecycle penuh (fungsi & class) | Tinggi | ✅ selesai |
| — | Hardening URL daftar atribut (`srcset`, `ping`) | Bonus | ✅ selesai |

Semua perbaikan ditutup dengan regression test di `test/audit-fixes.test.js` (21 test).

### Perubahan perilaku yang disengaja (breaking-ish)

1. **#4 — duplikat key**: perilaku lama "satu baris per key, item terakhir menang"
   (baris kembar dibuang dari DOM) diganti **degradasi ke full re-render + warning
   sekali**, sehingga setiap item tetap punya baris. Test lama di
   `test/list-reconciliation.test.js` diperbarui ke kontrak baru ini.
2. **#16 — `remove()`**: kini benar-benar melepas binding (dulu tidak). Jalur
   internal `_if`/`_else` (hide/show) memakai detach node mentah sehingga kontrak
   "cabang tersembunyi menjaga binding" tetap berlaku.
3. **#2 — `onUpdate`**: hook yang menulis state tidak lagi memicu dirinya sendiri
   secara rekursif (re-entransi di-skip). Perilaku lama = crash stack overflow.
4. **#10 — handler `stateOf`**: `get(value)` dipanggil dengan nilai mentah dan hasilnya
   dipakai sebagai hasil baca; `set(value)` dipanggil saat tulis dan boleh mengembalikan
   nilai pengganti. Sebelumnya keduanya tidak pernah dijalankan.

### Verifikasi akhir

| Suite | Hasil |
|---|---|
| Unit (`vitest run`, jsdom) | **413/413 lulus** (392 lama + 21 regression baru) |
| Memori & GC (`node --expose-gc test/memory/run.mjs`) | **105/105 lulus**, pertumbuhan heap stabil |
| `check-exports` + build minified | lulus (196 KB → 81 KB) |
| Smoke & pages (puppeteer) | **terblokir lingkungan mesin ini** — proses headless Chrome/Edge keluar senyap sebelum memuat kode (sudah gagal dengan cara yang sama sebelum perbaikan). Harness diperbarui ke `headless: 'new'` (mode lama sudah dihapus browser modern), tetapi mesin ini tetap tidak bisa men-spawn browser headless; jalankan `pnpm test:smoke && pnpm test:pages` di mesin dengan browser yang bisa di-automate. |

Catatan: `packages/jetz/src/*.min.js` diregenerasi dari sumber terbaru.

---

## 7. Audit lanjutan — jejak heap di benchmark (`clear 10.000 baris`)

**Pertanyaan:** mengapa kolom *JS heap* pada baris `Clear 10,000 rows · Jetz` sangat tinggi
(±1.039 MB vs Raw DOM 435 / React 355 / Vue 164)?

**Jawaban: itu terutama *garbage yang belum dikumpulkan*, bukan kebocoran.** Dua temuan:

1. **Semantik pengukuran.** `heapMb()` membaca `performance.memory.usedJSHeapSize` **tanpa
   GC paksa**, dan sampel `clear` diambil tepat setelah clear terakhir dari siklus
   reset→clear berulang (samples + warmup). Angka tersebut = heap live + semua garbage dari
   baris yang baru saja dilepas. Footnote lama ("anything left over is retained state") hanya
   benar setelah GC paksa.
2. **Rasio garbage mengikuti overhead per-baris jetz, bukan anomali.** Probe terukur
   (jsdom + `--expose-gc`, arm benchmark yang asli, 5 siklus render 2k → clear):

   | metrik (2.000 baris) | Raw DOM | Jetz | arti |
   |---|---|---|---|
   | live setelah create (GC dulu) | 141,8 MB | 186,6 MB | buku besar per-baris jetz |
   | garbage saat clear (tanpa GC) | 130,5 MB | 188,8 MB | volume alokasi yang dibuang clear |
   | **live setelah clear (GC dulu)** | **42,9 MB** | **44,0 MB** | **baseline — tidak ada retensi** |
   | drift live@clear 5 siklus | 0,1 MB | 0,1 MB | **tidak ada leak** |

   Setelah clear, heap live jetz kembali ke baseline (selisih ±1 MB = `ListState` + registri),
   dan drift 5 siklus 0,1 MB — konsisten dengan suite memori (105/105). Rasio garbage di
   Chrome lebih lebar (1.039/435 ≈ 2,4×) karena node DOM Chrome jauh lebih ramping dari jsdom,
   sehingga 23 objek `JetzElement` + state reaktif per baris mendominasi.

**Perbaikan yang diterapkan:**

- `JetzElement` kini mengalokasikan `oldStyle`, `_styleTarget`, `lifecycles` **secara lazy**
  (sebelumnya 3 objek kosong per elemen × 230.000 elemen per render 10k — murni tekanan GC).
- Event devtools (`create`/`attach`/`render`/`dispose`) dijaga `Jetz.isObservingDevtools` —
  objek literal per event tidak dialokasikan sama sekali saat tidak ada observer.
  Hasil probe (2k baris): live@create 193,2 → 186,6 MB, garbage@clear 196,5 → 188,8 MB;
  efek di Chrome lebih besar karena node DOM-nya ramping.
- Harness benchmark dibuat jujur sesuai footnote-nya: `run-headless.mjs` meluncurkan Chromium
  dengan `--js-flags=--expose-gc` dan `heapMb()` memaksa GC sebelum membaca — kolom JS heap
  kini **live heap** (setelah `clear`, sisa = retensi beneran). Tanpa flag itu (browser biasa
  saat `npm run dev`), angka tetap termasuk garbage dan footnotenya menjelaskannya.

Verifikasi setelah perubahan: **413/413 unit test**, **105/105 memory suite**, `check-exports` OK.
