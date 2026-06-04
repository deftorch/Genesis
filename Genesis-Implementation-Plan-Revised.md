# 🚀 Rencana Implementasi Pengembangan — Genesis (Revisi)

**Dokumen:** Implementation Roadmap v2.0 — UI-Safe Edition  
**Direvisi:** 4 Juni 2026  
**Berdasarkan:** Code Review Genesis-main + Analisis Risiko UI/UX  
**Status:** Draft Revisi — Siap Direview Tim

> **Apa yang berubah dari v1.0?**  
> Versi ini memperbaiki **5 kesalahan teknis** di Sprint 2 yang berpotensi merusak UI, melengkapi skema database Sprint 3 yang tidak lengkap, dan menambahkan panduan khusus untuk Sprint 5 agar fitur streaming tidak merusak tampilan chat yang ada.

---

## Daftar Isi

1. [Gambaran Umum & Filosofi](#1-gambaran-umum--filosofi)
2. [Sprint 1 — Keamanan & Stabilitas Kritis](#2-sprint-1--keamanan--stabilitas-kritis) ✅ Tidak berubah
3. [Sprint 2 — Refactoring Arsitektur](#3-sprint-2--refactoring-arsitektur) ⚠️ Direvisi besar
4. [Sprint 3 — Integrasi Supabase & Persistensi](#4-sprint-3--integrasi-supabase--persistensi) ⚠️ Skema dilengkapi
5. [Sprint 4 — Kualitas Kode & DX](#5-sprint-4--kualitas-kode--dx) ✅ Tidak berubah
6. [Sprint 5 — Fitur & Optimasi](#6-sprint-5--fitur--optimasi) ⚠️ Panduan streaming ditambah
7. [Matriks Risiko](#7-matriks-risiko)
8. [Definition of Done (DoD)](#8-definition-of-done-dod)
9. [Estimasi Upaya](#9-estimasi-upaya)

---

## 1. Gambaran Umum & Filosofi

### Tujuan Pengembangan

Mengubah Genesis dari proyek dengan fondasi baik menjadi aplikasi **production-grade** yang aman, maintainable, dan siap diskalakan — tanpa membuang apa yang sudah bekerja dengan baik.

### Prinsip Panduan

> **Jangan hancurkan yang belum rusak.** Setiap perubahan harus memiliki justifikasi jelas. Iterasi kecil lebih aman dari rewrite besar.

- **Security First** — Celah keamanan diprioritaskan di atas fitur baru
- **Refactor, Bukan Rewrite** — Pecah komponen besar secara inkremental
- **Test Before Ship** — Setiap perubahan harus dilindungi test
- **Backward Compatible** — Perubahan tidak boleh memutus fungsionalitas yang ada

### Ringkasan Sprint

| Sprint | Fokus | Durasi | Prioritas | Risiko UI |
|--------|-------|--------|-----------|-----------|
| Sprint 1 | Keamanan & Bug Kritis | 1 minggu | 🔴 Kritis | 🟢 Nol |
| Sprint 2 | Refactoring `page.tsx` | 2 minggu | 🔴 Kritis | 🔴 Tinggi |
| Sprint 3 | Supabase & Persistensi | 2 minggu | 🟠 Tinggi | 🟡 Sedang |
| Sprint 4 | Kualitas Kode & DX | 1 minggu | 🟡 Sedang | 🟢 Nol |
| Sprint 5 | Fitur & Optimasi | 2 minggu | 🟢 Normal | 🟡 Sedang |

**Total estimasi: ~8 minggu** (dengan tim 2-3 developer)

---

## 2. Sprint 1 — Keamanan & Stabilitas Kritis

> ✅ **Sprint ini tidak berubah dari v1.0.** Semua perubahan terbatas pada file API (`app/api/`) dan library baru — tidak menyentuh satu baris pun UI/UX.

**Durasi:** 1 minggu  
**Tujuan:** Menutup semua celah keamanan aktif sebelum kode lain disentuh.

---

### Tugas 1.1 — Rate Limiting pada `/api/chat`

**Prioritas:** 🔴 Kritis | **Estimasi:** 4 jam | **Risiko UI:** 🟢 Nol  
**File:** `app/api/chat/route.ts`, `lib/rate-limiter.ts` *(baru)*

Instal dependensi:

```bash
bun add lru-cache
```

Buat middleware rate limiter:

```typescript
// lib/rate-limiter.ts
import { LRUCache } from 'lru-cache';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
};

export function rateLimit(options?: Options) {
  const tokenCache = new LRUCache<string, number[]>({
    max: options?.uniqueTokenPerInterval ?? 500,
    ttl: options?.interval ?? 60_000,
  });

  return {
    check: (limit: number, token: string) => {
      const tokenCount = tokenCache.get(token) ?? [0];
      const currentUsage = tokenCount[0];

      if (currentUsage >= limit) {
        throw new Error('Rate limit exceeded');
      }

      tokenCache.set(token, [currentUsage + 1]);
    },
  };
}

export const chatRateLimiter = rateLimit({
  interval: 60_000,
  uniqueTokenPerInterval: 500,
});
```

Terapkan di route:

```typescript
// app/api/chat/route.ts — tambahkan di awal fungsi POST
const ip = req.headers.get('x-forwarded-for') 
        ?? req.headers.get('x-real-ip') 
        ?? 'anonymous';

try {
  chatRateLimiter.check(20, ip);
} catch {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}
```

---

### Tugas 1.2 — Perbaiki Validasi Magic Bytes WebP

**Prioritas:** 🔴 Kritis | **Estimasi:** 1 jam | **Risiko UI:** 🟢 Nol  
**File:** `app/api/upload-image/route.ts`

```typescript
// Ambil 12 byte untuk validasi WebP yang benar
const bytes = new Uint8Array(arrayBuffer.slice(0, 12));
let header = '';
for (let i = 0; i < 4; i++) {
  header += bytes[i].toString(16).padStart(2, '0').toUpperCase();
}

const isJpeg = header.startsWith('FFD8FF');
const isPng  = header.startsWith('89504E47');
const isGif  = header.startsWith('47494638');

// WebP: RIFF di byte 0-3 DAN 'WEBP' di byte 8-11
const webpSignature = Array.from(bytes.slice(8, 12))
  .map(b => String.fromCharCode(b))
  .join('');
const isWebp = header.startsWith('52494646') && webpSignature === 'WEBP';
```

---

### Tugas 1.3 — Hapus Fallback `CRON_TOKEN` yang Hardcoded

**Prioritas:** 🔴 Kritis | **Estimasi:** 30 menit | **Risiko UI:** 🟢 Nol  
**File:** `app/api/cleanup-images/route.ts`

```typescript
// Sebelum — ❌
const cronToken = process.env.CRON_TOKEN || 'local-fallback-cleanup-token';

// Sesudah — ✅
const cronToken = process.env.CRON_TOKEN;

if (!cronToken) {
  console.error('[Cleanup] CRON_TOKEN environment variable is not set.');
  return NextResponse.json(
    { error: 'Service not configured' },
    { status: 503 }
  );
}
```

Tambahkan ke `.env.example`:
```env
# WAJIB diisi sebelum deploy ke production
# Generate dengan: openssl rand -hex 32
CRON_TOKEN=your-secure-random-token-here
```

---

### Tugas 1.4 — Sanitasi Input `currentCode` untuk Mencegah Prompt Injection

**Prioritas:** 🔴 Kritis | **Estimasi:** 2 jam | **Risiko UI:** 🟢 Nol  
**File:** `app/api/chat/route.ts`, `lib/sanitize.ts` *(baru)*

```typescript
// lib/sanitize.ts
const MAX_CODE_LENGTH = 50_000;

export function sanitizeCodeForPrompt(code: string): string {
  if (!code || typeof code !== 'string') return '';
  
  const truncated = code.length > MAX_CODE_LENGTH 
    ? code.slice(0, MAX_CODE_LENGTH) + '\n// [truncated]'
    : code;

  // Escape triple backtick yang bisa menutup code block di prompt
  return truncated.replace(/```/g, '` ` `');
}
```

---

### Tugas 1.5 — Tambahkan Notifikasi Upload ke Layanan Eksternal

**Prioritas:** 🟠 Tinggi | **Estimasi:** 1 jam | **Risiko UI:** 🟢 Nol  
**File:** `components/image/ImageUpload.tsx`

Tambahkan teks disclaimer yang jelas di bawah area upload:

```tsx
{/* Tambahkan di bawah dropzone */}
<p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
  Gambar akan diunggah ke layanan hosting pihak ketiga untuk diproses.
  Hindari mengunggah informasi sensitif.
</p>
```

---

### Checklist Sprint 1

- [ ] Rate limiting 20 req/menit di `/api/chat`
- [ ] Magic bytes WebP diperbaiki (12 byte, validasi offset 8-11)
- [ ] `CRON_TOKEN` fallback dihapus, error 503 jika tidak di-set
- [ ] `currentCode` disanitasi sebelum injeksi ke prompt
- [ ] Notifikasi upload eksternal ditambahkan ke `ImageUpload.tsx`
- [ ] Semua test baru lulus di CI

---

## 3. Sprint 2 — Refactoring Arsitektur (`page.tsx`)

**Durasi:** 2 minggu  
**Tujuan:** Memecah `app/page.tsx` (~4.300 baris) menjadi komponen-komponen yang cohesive dan testable.

> ⚠️ **Sprint ini direvisi secara besar dari v1.0.** Rencana asli mengandung 5 masalah teknis yang akan merusak UI:
>
> 1. `useCanvasRenderer` menggunakan prefix matching yang salah — kode yang ada tidak selalu punya prefix `// renderer:`
> 2. `useChatSubmit` tidak lengkap — tidak ada AbortController, tidak ada konstruksi history pesan, tidak ada konversi image payload
> 3. Tidak ada rencana untuk shared UI state — `showArtifact`, `zoom`, `pan`, `activeTab`, dll. digunakan oleh banyak komponen
> 4. Target `page.tsx` tidak akurat — `{chat && <ArtifactPanel />}` salah, seharusnya `{showArtifact && <ArtifactPanel />}`
> 5. `useArtifactManager` dan `useVersionHistory` tidak dispesifikasikan sama sekali

---

### Strategi Refactoring

> **Pendekatan:** Strangler Fig Pattern — pindahkan satu bagian setiap kali, pastikan tidak ada regresi sebelum pindah ke bagian berikutnya.

**Urutan wajib:**

```
Langkah 0: Buat UI Store (HARUS DILAKUKAN PERTAMA)
Langkah 1: Ekstrak Canvas Renderers (paling aman, tidak ada shared state)
Langkah 2: Buat custom hooks (useChatSubmit, useArtifactManager, useVersionHistory)
Langkah 3: Ekstrak ChatPanel
Langkah 4: Ekstrak ArtifactPanel
Langkah 5: Ekstrak AppShell + Sidebar
Langkah 6: Rangkai ulang page.tsx
```

**Struktur target:**
```
app/
  page.tsx                        ← Orchestrator tipis (< 80 baris)

components/
  layout/
    AppShell.tsx                  ← Layout utama (sidebar + main area)
  canvas/
    renderers/
      P5Runner.tsx
      D3Runner.tsx
      SVGRenderer.tsx
      MermaidRenderer.tsx
  artifact/
    ArtifactPanel.tsx
    CodeEditor.tsx
    ArtifactToolbar.tsx
  chat/
    ChatPanel.tsx
    ChatInput.tsx                 ← (sudah ada, refinement)
    ChatMessage.tsx               ← (sudah ada, refinement)

hooks/
  useChatSubmit.ts
  useArtifactManager.ts
  useVersionHistory.ts

lib/store/
  chat-store.ts                   ← (sudah ada)
  ui-store.ts                     ← BARU — semua UI state
```

---

### Tugas 2.0 — Buat `ui-store.ts` (HARUS DILAKUKAN PERTAMA)

**Estimasi:** 4 jam | **Risiko UI:** 🟡 Sedang (harus dilakukan dengan benar)  
**File:** `lib/store/ui-store.ts` *(baru)*

**Mengapa ini harus dilakukan pertama?**

Komponen-komponen baru di Sprint 2 perlu berbagi state seperti `showArtifact`, `activeTab`, `zoom`, dll. Tanpa store terpusat, satu-satunya alternatif adalah prop drilling yang masif — yang justru membuat kode lebih sulit dipahami.

Pindahkan **semua UI state** dari `GenesisApp` ke store ini sebelum memecah komponen:

```typescript
// lib/store/ui-store.ts
import { create } from 'zustand';
import { RendererType } from '@/types';

interface UIState {
  // Panel visibility
  showArtifact: boolean;
  isArtifactFullscreen: boolean;
  sidebarOpen: boolean;
  isMobileTemplatesOpen: boolean;
  showMobileChatInput: boolean;

  // Active chat & view
  currentView: 'home' | 'chat' | 'chats' | 'gallery' | 'projects';
  activeChatId: string | null;
  activeProjectId: string | null;

  // Artifact / canvas
  p5Code: string;
  editableCode: string;
  activeRenderer: RendererType;
  activeTab: 'preview' | 'code' | 'diff';
  previousCode: string;
  copied: boolean;

  // Version system
  activeVersionNumber: number | null;
  isVersionDropdownOpen: boolean;

  // Zoom & pan
  zoom: number;
  pan: { x: number; y: number };
  panMode: boolean;
  isTrueFullscreen: boolean;

  // Input
  inputMessage: string;

  // Modals
  isSettingsOpen: boolean;
  isAuthModalOpen: boolean;
  isCreateProjectOpen: boolean;
  isMoveToProjectOpen: boolean;
  movingChatId: string | null;
  chatMenuOpenId: string | null;

  // Actions
  setShowArtifact: (show: boolean) => void;
  setIsArtifactFullscreen: (fs: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentView: (view: UIState['currentView']) => void;
  setActiveChatId: (id: string | null) => void;
  setActiveProjectId: (id: string | null) => void;
  setP5Code: (code: string) => void;
  setEditableCode: (code: string) => void;
  setActiveRenderer: (renderer: RendererType) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setPreviousCode: (code: string) => void;
  setActiveVersionNumber: (n: number | null) => void;
  setZoom: (updater: ((prev: number) => number) | number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setPanMode: (mode: boolean) => void;
  setIsTrueFullscreen: (fs: boolean) => void;
  setInputMessage: (msg: string) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setChatMenuOpenId: (id: string | null) => void;
  setMovingChatId: (id: string | null) => void;
  setIsMoveToProjectOpen: (open: boolean) => void;
  setIsCreateProjectOpen: (open: boolean) => void;

  // Compound actions
  resetForNewChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showArtifact: false,
  isArtifactFullscreen: false,
  sidebarOpen: true,
  isMobileTemplatesOpen: false,
  showMobileChatInput: false,
  currentView: 'home',
  activeChatId: null,
  activeProjectId: null,
  p5Code: '',
  editableCode: '',
  activeRenderer: 'p5',
  activeTab: 'preview',
  previousCode: '',
  copied: false,
  activeVersionNumber: null,
  isVersionDropdownOpen: false,
  zoom: 1,
  pan: { x: 0, y: 0 },
  panMode: false,
  isTrueFullscreen: false,
  inputMessage: '',
  isSettingsOpen: false,
  isAuthModalOpen: false,
  isCreateProjectOpen: false,
  isMoveToProjectOpen: false,
  movingChatId: null,
  chatMenuOpenId: null,

  setShowArtifact: (show) => set({ showArtifact: show }),
  setIsArtifactFullscreen: (fs) => set({ isArtifactFullscreen: fs }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentView: (view) => set({ currentView: view }),
  setActiveChatId: (id) => set({ activeChatId: id }),
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setP5Code: (code) => set({ p5Code: code }),
  setEditableCode: (code) => set({ editableCode: code }),
  setActiveRenderer: (renderer) => set({ activeRenderer: renderer }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setPreviousCode: (code) => set({ previousCode: code }),
  setActiveVersionNumber: (n) => set({ activeVersionNumber: n }),
  setZoom: (updater) =>
    set((s) => ({
      zoom: typeof updater === 'function'
        ? Math.max(0.25, Math.min(updater(s.zoom), 4))
        : Math.max(0.25, Math.min(updater, 4)),
    })),
  setPan: (pan) => set({ pan }),
  setPanMode: (mode) => set({ panMode: mode }),
  setIsTrueFullscreen: (fs) => set({ isTrueFullscreen: fs }),
  setInputMessage: (msg) => set({ inputMessage: msg }),
  setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setChatMenuOpenId: (id) => set({ chatMenuOpenId: id }),
  setMovingChatId: (id) => set({ movingChatId: id }),
  setIsMoveToProjectOpen: (open) => set({ isMoveToProjectOpen: open }),
  setIsCreateProjectOpen: (open) => set({ isCreateProjectOpen: open }),

  resetForNewChat: () =>
    set({
      currentView: 'home',
      activeChatId: null,
      p5Code: '',
      editableCode: '',
      previousCode: '',
      showArtifact: false,
      isArtifactFullscreen: false,
      activeVersionNumber: null,
      inputMessage: '',
    }),
}));
```

**Cara migrasi yang aman:**

Jangan langsung hapus `useState` dari `GenesisApp`. Migrasi secara bertahap:
1. Buat `ui-store.ts`
2. Pada setiap bagian yang diekstrak ke komponen baru, ganti `useState` lokal dengan `useUIStore`
3. Hapus `useState` dari `GenesisApp` hanya setelah komponen barunya berjalan dengan benar

---

### Tugas 2.1 — Ekstrak Canvas Renderers

**Estimasi:** 2 hari | **Risiko UI:** 🟢 Rendah (komponen sudah ada, hanya dipindahkan)  
**File target:** `components/canvas/renderers/*.tsx`

> ℹ️ Komponen P5Canvas, D3Canvas, SVGCanvas, MermaidCanvas **sudah ada** di codebase. Tugas ini hanya memastikan mereka punya interface yang konsisten untuk dipakai oleh `ArtifactPanel`.

Standardisasi interface semua renderer:

```tsx
// Interface yang konsisten untuk semua renderer
interface RendererProps {
  code: string;
  width?: number;
  height?: number;
  onError?: (error: Error) => void;
}
```

Pastikan semua renderer yang ada (`P5Canvas`, `D3Canvas`, `SVGCanvas`, `MermaidCanvas`) sudah mengikuti interface ini. Jika ada yang tidak, update props-nya.

---

### Tugas 2.2 — Buat Hook `useCanvasRenderer` (Versi Diperbaiki)

**Estimasi:** 2 jam | **Risiko UI:** 🟢 Rendah  
**File:** `hooks/useCanvasRenderer.ts`

> ⚠️ **Perbaikan kritis dari v1.0:** Rencana asli menggunakan prefix matching (`trimStart().startsWith('// renderer: p5')`). Ini **salah** karena banyak kode p5.js yang dibuat AI tidak memiliki prefix tersebut. Harus menggunakan fungsi `extractCode()` yang sudah ada dan terbukti bekerja.

```typescript
// hooks/useCanvasRenderer.ts
import { useMemo } from 'react';
import { extractCode } from '@/lib/extract-code';
import { RendererType } from '@/types';

/**
 * Deteksi renderer dari konten pesan AI.
 * Menggunakan extractCode() yang sama dengan yang dipakai di page.tsx
 * sehingga hasil selalu konsisten.
 */
export function useCanvasRenderer(messageContent: string | null): {
  code: string | null;
  renderer: RendererType | null;
} {
  return useMemo(() => {
    if (!messageContent) return { code: null, renderer: null };
    const extracted = extractCode(messageContent);
    if (!extracted) return { code: null, renderer: null };
    return { code: extracted.code, renderer: extracted.renderer };
  }, [messageContent]);
}
```

---

### Tugas 2.3 — Buat Hook `useChatSubmit` (Versi Diperbaiki)

**Estimasi:** 3 hari | **Risiko UI:** 🔴 Tinggi (harus identik dengan logic yang ada)  
**File:** `hooks/useChatSubmit.ts`

> ⚠️ **Perbaikan kritis dari v1.0:** Versi asli memiliki 4 masalah:
> 1. Tidak ada AbortController (tidak bisa stop generation)
> 2. `messages` tidak dibangun dari store — diperlukan untuk konteks percakapan
> 3. Image payload (data URL → base64) tidak dikonversi
> 4. `syncMessagesFromStore` tidak diimplementasikan

```typescript
// hooks/useChatSubmit.ts
import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/lib/store/chat-store';
import { useUIStore } from '@/lib/store/ui-store';
import { extractCode } from '@/lib/extract-code';
import { ImageAttachment } from '@/types';

interface UseChatSubmitOptions {
  chatId: string | null;
  selectedModel: string;
}

export function useChatSubmit({ chatId, selectedModel }: UseChatSubmitOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const chatStore = useChatStore();
  const ui = useUIStore();

  // Bangun image payloads dari data URLs (sama persis dengan logic di page.tsx)
  const buildImagePayloads = useCallback((images: ImageAttachment[]) => {
    return images.map((img) => {
      const url = img.url;
      if (url.startsWith('data:')) {
        const match = url.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) return { mimeType: match[1], base64: match[2] };
      }
      return { url };
    });
  }, []);

  // Sync pesan dari store ke local state (dibutuhkan setelah update store)
  const syncMessages = useCallback((targetChatId: string) => {
    const chat = chatStore.chats.find((c) => c.id === targetChatId);
    if (!chat) return;
    return chat.messages.map((msg) => ({
      type: msg.role === 'user' ? 'user' : 'ai',
      content: msg.content,
    }));
  }, [chatStore.chats]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setRegeneratingId(null);
    }
  }, []);

  const submit = useCallback(async (
    messageToSend: string,
    currentMessages: { type: string; content: string; images?: string[] }[],
    images: ImageAttachment[] = [],
    activeChatId: string | null = chatId,
  ) => {
    if (!messageToSend.trim() && images.length === 0) return;

    const imagePreviewUrls = images.map((img) => img.preview || img.url);

    const newMessages = [
      ...currentMessages,
      {
        type: 'user',
        content: messageToSend,
        images: imagePreviewUrls.length > 0 ? imagePreviewUrls : undefined,
      },
    ];

    ui.setInputMessage('');
    setIsLoading(true);
    ui.setCurrentView('chat');
    ui.setShowArtifact(false);

    // Buat chat baru jika belum ada
    let currentChatId = activeChatId;
    if (!currentChatId) {
      const title = messageToSend.length > 40
        ? messageToSend.substring(0, 40) + '...'
        : messageToSend;
      currentChatId = chatStore.createChat(title);
      chatStore.updateModelConfig(currentChatId, { model: selectedModel });
      ui.setActiveChatId(currentChatId);
    }

    chatStore.addMessage(currentChatId, {
      role: 'user',
      content: messageToSend,
      tokens: Math.ceil(messageToSend.length / 4),
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const imagePayloads = buildImagePayloads(images);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: newMessages.map((msg) => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content,
          })),
          model: selectedModel,
          currentCode: ui.editableCode || '',
          images: imagePayloads.length > 0 ? imagePayloads : undefined,
        }),
      });

      const data = await response.json();

      if (data.error) {
        const errContent = `Error: ${data.error}`;
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: errContent,
          tokens: 10,
        });
      } else {
        const aiContent = data.message?.content || 'No response received';
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: aiContent,
          tokens: Math.ceil(aiContent.length / 4),
        });

        const extracted = extractCode(aiContent);
        if (extracted) {
          if (ui.p5Code) ui.setPreviousCode(ui.p5Code);
          ui.setP5Code(extracted.code);
          ui.setEditableCode(extracted.code);
          ui.setActiveRenderer(extracted.renderer);
          ui.setActiveTab('preview');
          ui.setShowArtifact(true);

          const chat = chatStore.chats.find((c) => c.id === currentChatId);
          const existingArtifact = chatStore.artifacts.find(
            (a) => a.chatId === currentChatId,
          );
          if (existingArtifact) {
            chatStore.deleteArtifact(existingArtifact.id);
          }
          chatStore.addArtifact({
            chatId: currentChatId!,
            chatTitle: chat?.title || 'Untitled',
            code: extracted.code,
            renderer: extracted.renderer,
          });
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: 'Generation stopped.',
          tokens: 0,
        });
      } else {
        chatStore.addMessage(currentChatId, {
          role: 'assistant',
          content: 'Failed to connect to AI service. Please try again.',
          tokens: 10,
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [chatId, selectedModel, ui, chatStore, buildImagePayloads]);

  return { submit, isLoading, stopGeneration, regeneratingId, setRegeneratingId };
}
```

---

### Tugas 2.4 — Buat Hook `useVersionHistory`

**Estimasi:** 1 hari | **Risiko UI:** 🟡 Sedang  
**File:** `hooks/useVersionHistory.ts`

> ℹ️ **Tugas ini tidak ada di v1.0** tapi dibutuhkan — logic version tracking di `page.tsx` sangat kompleks dan harus diekstrak ke hook tersendiri sebelum `ArtifactPanel` bisa berdiri sendiri.

```typescript
// hooks/useVersionHistory.ts
import { useEffect } from 'react';
import { extractCode } from '@/lib/extract-code';
import { useUIStore } from '@/lib/store/ui-store';
import { RendererType } from '@/types';

interface Message {
  type: string;
  content: string;
}

interface CodeVersion {
  code: string;
  renderer: RendererType;
  messageIndex: number;
  versionNumber: number;
}

export function useVersionHistory(messages: Message[]) {
  const ui = useUIStore();

  // Sama persis dengan logic di page.tsx — extract versions dari messages
  const getVersionsFromMessages = (msgs: Message[]): CodeVersion[] => {
    const list: CodeVersion[] = [];
    let versionCounter = 1;
    msgs.forEach((msg, idx) => {
      if (msg.type === 'ai') {
        const extracted = extractCode(msg.content);
        if (extracted) {
          list.push({
            code: extracted.code,
            renderer: extracted.renderer,
            messageIndex: idx,
            versionNumber: versionCounter++,
          });
        }
      }
    });
    return list;
  };

  // Dijalankan setiap kali messages berubah
  useEffect(() => {
    const extractedVersions = getVersionsFromMessages(messages);

    const versionCountChanged = extractedVersions.length !== 
      // compare dengan versioning yang tersimpan di store
      (ui.activeVersionNumber !== null ? extractedVersions.length : 0);

    if (extractedVersions.length > 0) {
      if (versionCountChanged || extractedVersions.length === 1) {
        const latest = extractedVersions[extractedVersions.length - 1];
        ui.setActiveVersionNumber(latest.versionNumber);
        ui.setP5Code(latest.code);
        ui.setEditableCode(latest.code);
        ui.setActiveRenderer(latest.renderer);
      }
    } else {
      ui.setActiveVersionNumber(null);
    }
  }, [messages]);

  return { getVersionsFromMessages };
}
```

---

### Tugas 2.5 — Rangkai Ulang `page.tsx` (Versi Diperbaiki)

**Estimasi:** 1 hari | **Risiko UI:** 🟡 Sedang  
**File:** `app/page.tsx`

> ⚠️ **Perbaikan kritis dari v1.0:** Target asli `{chat && <ArtifactPanel />}` salah. ArtifactPanel terlihat berdasarkan `showArtifact`, bukan keberadaan chat.

```tsx
// app/page.tsx — target setelah refactoring
'use client';

import { AppShell } from '@/components/layout/AppShell';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { ArtifactPanel } from '@/components/artifact/ArtifactPanel';
import { useUIStore } from '@/lib/store/ui-store';

export default function GenesisApp() {
  const { showArtifact, isArtifactFullscreen } = useUIStore();

  return (
    <AppShell>
      {/* Chat panel — tersembunyi jika artifact fullscreen */}
      {!isArtifactFullscreen && (
        <ChatPanel className={showArtifact ? 'w-1/2' : 'w-full'} />
      )}

      {/* Artifact panel — tampil hanya jika showArtifact = true */}
      {showArtifact && (
        <ArtifactPanel className={isArtifactFullscreen ? 'w-full' : 'w-1/2'} />
      )}
    </AppShell>
  );
}
```

---

### Checklist Sprint 2

- [ ] `ui-store.ts` dibuat **SEBELUM** komponen baru diekstrak
- [ ] Semua renderer memiliki interface `{ code, width?, height?, onError? }` yang konsisten
- [ ] `useCanvasRenderer` menggunakan `extractCode()` — bukan prefix matching
- [ ] `useChatSubmit` memiliki AbortController, image payload, dan history building
- [ ] `useVersionHistory` dibuat dan ditest
- [ ] `useArtifactManager` dibuat untuk CRUD artifact (deleteArtifact, addArtifact)
- [ ] `AppShell`, `ChatPanel`, `ArtifactPanel` dibuat menggunakan `useUIStore`
- [ ] `page.tsx` menggunakan `showArtifact` — bukan `chat &&`
- [ ] Tidak ada regresi — semua test lama masih lulus
- [ ] E2E test `chat-flow.spec.ts` masih hijau

---

## 4. Sprint 3 — Integrasi Supabase & Persistensi

**Durasi:** 2 minggu  
**Tujuan:** Menyelesaikan integrasi Supabase agar fitur auth benar-benar berguna.

> ⚠️ **Sprint ini direvisi dari v1.0:** Skema database asli tidak lengkap — tabel `projects` dan `message_versions` tidak ada.

---

### Tugas 3.1 — Desain Skema Database Supabase (Versi Dilengkapi)

**Estimasi:** 4 jam

```sql
-- supabase/migrations/001_initial_schema.sql

-- Tabel projects (BARU — tidak ada di v1.0)
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel chat utama
CREATE TABLE chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL, -- BARU
  title       TEXT NOT NULL DEFAULT 'New Chat',
  summary     TEXT,
  model       TEXT NOT NULL DEFAULT 'gemini-3-flash',
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel pesan
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id         UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  active_version  INTEGER NOT NULL DEFAULT 0,
  tokens          INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel versi pesan (BARU — untuk fitur regenerate & version history)
CREATE TABLE message_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  version_idx INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel artifact
CREATE TABLE artifacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id     UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_title  TEXT NOT NULL DEFAULT '', -- BARU — denormalisasi untuk Gallery
  code        TEXT NOT NULL,
  renderer    TEXT NOT NULL CHECK (renderer IN ('p5', 'd3', 'svg', 'mermaid')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE projects         ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats            ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own projects"
  ON projects FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own chats"
  ON chats FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own messages via chat"
  ON messages FOR ALL USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
  );

CREATE POLICY "Users own message versions via message"
  ON message_versions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN chats c ON c.id = m.chat_id
      WHERE m.id = message_versions.message_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users own artifacts"
  ON artifacts FOR ALL USING (auth.uid() = user_id);

-- Index untuk performa
CREATE INDEX idx_projects_user_id    ON projects(user_id, created_at DESC);
CREATE INDEX idx_chats_user_id       ON chats(user_id, updated_at DESC);
CREATE INDEX idx_chats_project_id    ON chats(project_id);
CREATE INDEX idx_messages_chat_id    ON messages(chat_id, created_at ASC);
CREATE INDEX idx_msg_versions_msg_id ON message_versions(message_id, version_idx ASC);
CREATE INDEX idx_artifacts_user_id   ON artifacts(user_id, created_at DESC);
```

---

### Tugas 3.2 — Buat Service Layer untuk Supabase

**Estimasi:** 3 hari  
**File:** `lib/services/chat-service.ts`

Sama dengan v1.0, ditambah method untuk projects dan message_versions:

```typescript
export const chatService = {
  // ... method yang sudah ada di v1.0 ...

  // Tambahan untuk projects
  async getProjects(userId: string) { ... },
  async createProject(userId: string, name: string, description?: string) { ... },
  async deleteProject(projectId: string) { ... },

  // Tambahan untuk message versions
  async addMessageVersion(messageId: string, content: string, versionIdx: number) { ... },
  async getMessageVersions(messageId: string) { ... },
};
```

---

### Tugas 3.3 — Strategi Hybrid: Cloud + LocalStorage

**Estimasi:** 2 hari

Sama dengan v1.0:

- **User terautentikasi** → simpan ke Supabase, sync ke localStorage sebagai cache
- **User anonim** → simpan ke localStorage saja (seperti sekarang)
- Saat user login pertama kali, **tawarkan migrasi** chat lokal ke cloud dengan dialog konfirmasi

---

### Checklist Sprint 3

- [ ] Tabel `projects` ada di skema (tidak ada di v1.0)
- [ ] Tabel `message_versions` ada di skema (tidak ada di v1.0)
- [ ] Kolom `chat_title` ada di tabel `artifacts`
- [ ] Row Level Security dikonfigurasi dan ditest untuk semua tabel
- [ ] `chat-service.ts` dibuat dengan CRUD lengkap
- [ ] Chat store diupdate untuk menggunakan Supabase saat user login
- [ ] Migrasi chat lokal ke cloud dengan dialog konfirmasi
- [ ] Fallback ke localStorage jika tidak login

---

## 5. Sprint 4 — Kualitas Kode & Developer Experience

> ✅ **Sprint ini tidak berubah dari v1.0.** Semua perubahan adalah backend/tooling dan tidak menyentuh UI.

**Durasi:** 1 minggu

---

### Tugas 4.1 — Bersihkan Dead Code di `lib/env.ts`

Hapus semua referensi ke provider yang tidak digunakan (OpenAI, Anthropic, NextAuth).

---

### Tugas 4.2 — Refactor `getGeminiApiKeys()` — Hapus `require()` Dinamis

**Sebelum:** `require('@/lib/store/settings-store')` dinamis di dalam fungsi  
**Sesudah:** Terima `userKey?: string` sebagai parameter

```typescript
export function getGeminiApiKeys(userKey?: string): string[] {
  const keys: string[] = [];
  
  if (userKey) keys.push(userKey);
  
  if (process.env.GEMINI_API_KEY && !keys.includes(process.env.GEMINI_API_KEY)) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  
  let index = 1;
  while (true) {
    const key = process.env[`GEMINI_API_KEY_${index}`];
    if (!key) break;
    if (!keys.includes(key)) keys.push(key);
    index++;
  }
  
  return keys;
}
```

---

### Tugas 4.3 — Standardisasi Bahasa Komentar ke Bahasa Inggris

File yang perlu diupdate: `lib/chat-summarizer.ts`, `lib/store/chat-store.ts`

---

### Tugas 4.4 — Aktifkan ESLint pada Build

```javascript
// next.config.js — sesudah (hapus eslint block atau ubah ke false)
// Jalankan 'bun run lint' dan perbaiki semua error SEBELUM mengaktifkan flag ini
eslint: {
  ignoreDuringBuilds: false,
}
```

---

### Tugas 4.5 — Gunakan Token Aktual dari Gemini API

```typescript
// Sesudah (dari response Gemini):
const usage = data.usageMetadata;
const promptTokens     = usage?.promptTokenCount     ?? 0;
const completionTokens = usage?.candidatesTokenCount ?? 0;
const totalTokens      = usage?.totalTokenCount      ?? 0;
```

---

### Tugas 4.6 — Validasi Input `model` di `/api/chat`

```typescript
const ALLOWED_MODELS = ['gemini-3-flash', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const;

if (!ALLOWED_MODELS.includes(model)) {
  return NextResponse.json(
    { error: `Model '${model}' is not supported.` },
    { status: 400 }
  );
}
```

---

### Checklist Sprint 4

- [ ] Dead code di `lib/env.ts` dihapus
- [ ] `require()` dinamis di `getGeminiApiKeys` direfactor
- [ ] Semua komentar Bahasa Indonesia diubah ke Inggris
- [ ] `eslint.ignoreDuringBuilds` dinonaktifkan
- [ ] Token count menggunakan `usageMetadata` dari Gemini
- [ ] Validasi `model` ditambahkan di `/api/chat`

---

## 6. Sprint 5 — Fitur & Optimasi

**Durasi:** 2 minggu

> ⚠️ **Sprint ini ditambahkan panduan untuk streaming** — fitur baru yang paling berisiko merusak UI chat yang ada.

---

### Tugas 5.1 — Streaming Response dari Gemini (Dengan Panduan UI)

**Estimasi:** 4 hari | **Risiko UI:** 🟡 Sedang

Saat ini API menunggu response penuh sebelum mengirim ke client. Dengan streaming, pengguna melihat teks muncul secara progresif.

**Perhatian penting untuk UI:**

Fungsi `renderAiMessage` saat ini menggunakan regex pada konten yang **sudah lengkap**:
```typescript
// renderAiMessage — hanya bekerja pada konten lengkap
const codeRegex = /```(?:javascript|js|...)?\n([\s\S]*?)```/g;
const match = codeRegex.exec(content); // ❌ Gagal jika konten belum selesai
```

Untuk streaming, buat state `streamingContent` yang diupdate secara progresif, dan tunda render code block sampai streaming selesai:

```typescript
// Di useChatSubmit — tambahkan streaming support
const [streamingContent, setStreamingContent] = useState('');
const [isStreaming, setIsStreaming] = useState(false);

// Render yang aman untuk konten partial
const renderMessage = (content: string, isPartial: boolean) => {
  if (isPartial) {
    // Selama streaming: render sebagai teks biasa, jangan coba parse code block
    return (
      <div className="prose prose-sm dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }
  // Setelah selesai: gunakan renderAiMessage yang sudah ada
  return renderAiMessage(content, messageIndex);
};
```

Tambahkan feature flag untuk mudah di-disable jika ada masalah:

```typescript
// config/constants.ts
export const FEATURE_FLAGS = {
  STREAMING_ENABLED: process.env.NEXT_PUBLIC_STREAMING === 'true',
};
```

---

### Tugas 5.2 — Export Artifact ke File

**Estimasi:** 1 hari | **Risiko UI:** 🟢 Rendah  
**File:** `components/artifact/ArtifactToolbar.tsx`

```typescript
const handleExport = (code: string, renderer: RendererType) => {
  const extension = renderer === 'svg' ? 'svg' 
    : renderer === 'mermaid' ? 'mmd' 
    : 'js';
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `genesis-artifact-${Date.now()}.${extension}`;
  a.click();
  
  URL.revokeObjectURL(url);
};
```

---

### Tugas 5.3 — Optimasi Bundle Size

**Estimasi:** 1 hari | **Risiko UI:** 🟢 Rendah

```typescript
// Lazy load hanya saat dibutuhkan (sudah ada pattern ini di page.tsx)
const MermaidCanvas = dynamic(
  () => import('@/components/mermaid/MermaidCanvas'),
  { ssr: false }
);

const MarkdownRenderer = dynamic(
  () => import('@/components/chat/MarkdownRenderer'),
  { loading: () => <SkeletonText /> }
);
```

---

### Tugas 5.4 — Dark/Light Mode yang Konsisten

**Estimasi:** 1 hari | **Risiko UI:** 🟢 Rendah

Pastikan semua komponen baru dari Sprint 2-3 menggunakan `dark:` Tailwind classes yang konsisten dengan komponen yang sudah ada.

---

### Checklist Sprint 5

- [ ] Streaming diimplementasikan dengan feature flag untuk mudah di-disable
- [ ] `renderAiMessage` aman untuk konten partial saat streaming
- [ ] Export artifact ke file berfungsi
- [ ] Bundle size dioptimasi dengan lazy loading
- [ ] Dark/light mode konsisten di semua komponen baru

---

## 7. Matriks Risiko

| Risiko | Probabilitas | Dampak | Mitigasi |
|--------|-------------|--------|----------|
| Regresi saat refactoring `page.tsx` tanpa ui-store | Sangat Tinggi | Tinggi | Buat ui-store PERTAMA, migrasi state secara bertahap |
| `useCanvasRenderer` dengan prefix matching merusak p5 detection | Tinggi | Tinggi | Gunakan `extractCode()` yang sudah ada |
| `useChatSubmit` tanpa AbortController | Tinggi | Sedang | Implementasi stop generation sejak awal |
| Migrasi chat ke Supabase gagal | Sedang | Tinggi | Dialog konfirmasi + backup localStorage |
| Streaming merusak rendering code block | Sedang | Tinggi | Feature flag + partial render yang aman |
| `gemini-3-flash-preview` dihapus Google | Rendah | Tinggi | Fallback ke `gemini-2.5-flash` |
| Rate limiter memblok user legitimate | Rendah | Sedang | Limit konservatif (20/menit), logging |

---

## 8. Definition of Done (DoD)

Setiap tugas dianggap **selesai** jika memenuhi semua kriteria berikut:

### Kode
- [ ] Implementasi sesuai spesifikasi di dokumen ini
- [ ] Tidak ada `any` TypeScript baru tanpa justifikasi
- [ ] Tidak ada `console.log` debugging (hanya `console.error`)
- [ ] Semua fungsi baru memiliki JSDoc minimal

### Testing
- [ ] Unit test ditulis untuk semua logic baru
- [ ] Test lama tidak ada yang rusak
- [ ] Coverage tidak turun dari baseline

### CI/CD
- [ ] `bun run lint` lulus tanpa warning baru
- [ ] `bun run test:unit` lulus
- [ ] `bun run test:e2e` lulus (minimal `chat-flow.spec.ts`)
- [ ] `bun run build` sukses

### Review
- [ ] Pull Request mendapat minimal 1 approval
- [ ] Tidak ada PR comment yang unresolved
- [ ] CHANGELOG diupdate jika perubahan user-facing

---

## 9. Estimasi Upaya

| Sprint | Tugas Utama | Estimasi (hari-orang) | Perubahan dari v1.0 |
|--------|-------------|----------------------|---------------------|
| Sprint 1 | 5 tugas keamanan | 3 | Tidak berubah |
| Sprint 2 | Refactoring + ui-store | **12** (+2) | +ui-store, +useVersionHistory |
| Sprint 3 | Supabase integration | **9** (+1) | +projects & message_versions |
| Sprint 4 | Code quality | 4 | Tidak berubah |
| Sprint 5 | Fitur baru | **8** (+1) | +feature flag streaming |
| **Total** | | **~36 hari-orang** | |

Dengan **2 developer**, total estimasi adalah **~18 minggu kerja**, atau **8-9 minggu kalender** dengan beberapa tugas paralel.

---

## Lampiran — File yang Dimodifikasi per Sprint

### Sprint 1 (zero UI risk)
- `app/api/chat/route.ts`
- `app/api/upload-image/route.ts`
- `app/api/cleanup-images/route.ts`
- `components/image/ImageUpload.tsx` *(hanya tambah teks disclaimer)*
- `lib/rate-limiter.ts` *(baru)*
- `lib/sanitize.ts` *(baru)*
- `.env.example`, `.env.local.example`

### Sprint 2 (high risk — ikuti urutan wajib)
- `lib/store/ui-store.ts` *(baru — HARUS PERTAMA)*
- `app/page.tsx` *(refactor — last step)*
- `components/layout/AppShell.tsx` *(baru)*
- `components/artifact/ArtifactPanel.tsx` *(baru)*
- `components/artifact/ArtifactToolbar.tsx` *(baru)*
- `components/artifact/CodeEditor.tsx` *(baru)*
- `components/chat/ChatPanel.tsx` *(baru)*
- `hooks/useChatSubmit.ts` *(baru)*
- `hooks/useArtifactManager.ts` *(baru)*
- `hooks/useVersionHistory.ts` *(baru — tidak ada di v1.0)*
- `hooks/useCanvasRenderer.ts` *(baru — menggunakan extractCode())*

### Sprint 3
- `supabase/migrations/001_initial_schema.sql` *(baru — skema dilengkapi)*
- `lib/services/chat-service.ts` *(baru)*
- `lib/store/chat-store.ts` *(update)*
- `hooks/useChatSync.ts` *(baru)*

### Sprint 4 (zero UI risk)
- `lib/env.ts`
- `config/constants.ts`
- `lib/chat-summarizer.ts`
- `next.config.js`
- `app/api/chat/route.ts`

### Sprint 5
- `app/api/chat/route.ts` *(streaming + feature flag)*
- `hooks/useChatSubmit.ts` *(streaming support)*
- `components/artifact/ArtifactToolbar.tsx` *(export)*
- `app/layout.tsx` *(lazy loading)*
- `config/constants.ts` *(FEATURE_FLAGS)*

---

*Dokumen ini adalah living document. Perbarui setiap kali ada perubahan scope atau prioritas.*
