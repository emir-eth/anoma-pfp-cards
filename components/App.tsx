import Link from 'next/link'
import React, { useMemo, useRef, useState, forwardRef } from 'react'
import { toPng } from 'html-to-image'
import { ImageUp, Download, Twitter } from 'lucide-react'

const CARD_W = 1140
const CARD_H = 1230
const ANOMA_RED = '#E50914'

const PREVIEW_SCALE = 0.6
const PREVIEW_VIEW_W = Math.round(CARD_W * PREVIEW_SCALE)




async function watermarkImage(file: File): Promise<Blob> {
  const imgUrl = await fileToDataUrl(file)
  const img = new Image()
  img.crossOrigin = 'anonymous'
  const loaded: HTMLImageElement = await new Promise((res, rej) => {
    img.onload = () => res(img)
    img.onerror = rej
    img.src = imgUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = loaded.naturalWidth
  canvas.height = loaded.naturalHeight
  const ctx = canvas.getContext('2d')!
  // draw original
  ctx.drawImage(loaded, 0, 0, canvas.width, canvas.height)

  // watermark settings (dotted outline)
  const text = 'DO NOT USE'
  const fontSize = Math.max(24, Math.floor(canvas.width * 0.08))
  ctx.font = `800 ${fontSize}px ui-sans-serif, system-ui, -apple-system`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // rotate canvas and tile
  ctx.save()
  ctx.translate(canvas.width/2, canvas.height/2)
  ctx.rotate(-Math.PI/6) // ~ -30deg

  const stepX = fontSize * 7
  const stepY = fontSize * 4.5

  // Dotted stroke
  ctx.lineWidth = Math.max(2, Math.floor(fontSize * 0.06))
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'
  ctx.setLineDash([ctx.lineWidth * 1.2, ctx.lineWidth * 1.8])

  for (let y = -canvas.height; y <= canvas.height; y += stepY) {
    for (let x = -canvas.width; x <= canvas.width; x += stepX) {
      ctx.strokeText(text, x, y)
    }
  }

  // Very faint inner fill to ensure visibility on darks
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  for (let y = -canvas.height; y <= canvas.height; y += stepY) {
    for (let x = -canvas.width; x <= canvas.width; x += stepX) {
      ctx.fillText(text, x, y)
    }
  }

  ctx.restore()

  const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.92))
  return blob
}

// Simple in-memory "community" mock until Supabase wiring

// removed placeholder loadCommunityMock()

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.317 4.369A17.53 17.53 0 0 0 16.558 3c-.2.356-.43.83-.589 1.205a16.093 16.093 0 0 0-4-.001c-.16-.375-.39-.85-.59-1.205a17.53 17.53 0 0 0-3.758 1.37C3.95 8.097 3.18 11.64 3.454 15.13A17.64 17.64 0 0 0 7.43 16.9c.3-.41.567-.85.794-1.314a11.6 11.6 0 0 1-1.26-.604c.106-.078.21-.16.31-.244a12.9 12.9 0 0 0 9.45 0c.101.085.205.166.31.244-.4.232-.825.43-1.26.603.227.465.494.905.794 1.315a17.64 17.64 0 0 0 3.975-1.77c.33-4.1-.56-7.61-2.48-10.761ZM9.69 13.61c-.78 0-1.42-.73-1.42-1.63 0-.9.63-1.63 1.42-1.63.8 0 1.43.74 1.42 1.63 0 .9-.63 1.63-1.42 1.63Zm4.62 0c-.78 0-1.42-.73-1.42-1.63 0-.9.64-1.63 1.42-1.63.8 0 1.43.74 1.42 1.63 0 .9-.63 1.63-1.42 1.63Z"/>
    </svg>
  );
}

type CardProps = {
  pfp: string | null
  tw: string
  dc: string
  badge: string
  fixed?: boolean
}

/** Anoma black/white/red portrait card */
const Card = forwardRef<HTMLDivElement, CardProps>(function Card({ pfp, tw, dc, badge, fixed }, ref) {
  return (
    <div
      ref={ref}
      className="relative overflow-hidden"
      style={ fixed
        ? { width: CARD_W, height: CARD_H }
        : { width: '100%', aspectRatio: `${CARD_W} / ${CARD_H}` }
      }
    >
      {/* Outer dark frame with subtle red glow */}
      <div
        className="absolute inset-0 rounded-[28px] p-1"
        style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))', boxShadow: '0 30px 90px rgba(229,9,20,0.18)' }}
      >
        {/* Inner dark card */}
        <div className="w-full h-full rounded-[24px] bg-[#0B0B0B] text-white pt-5 px-6 pb-0 flex flex-col ring-1 ring-white/10">
          {/* tiny top red accent */}
          <div className="h-[3px] w-full rounded-full" style={{ background: ANOMA_RED }} />

          {/* Header: logo + anoma (left) , badge (right) */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/anoma-logo.svg" className="h-6 w-auto" />
              <span className="text-2xl font-semibold tracking-wide">anoma</span>
            </div>
            <div className="rounded-full px-3 py-1.5 text-xl inline-flex items-center gap-2"
                 style={{ background: 'rgba(229,9,20,0.14)', border: '1px solid rgba(229,9,20,0.28)' }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: ANOMA_RED }}></span>
              <span className="font-medium">{badge?.trim() ? badge : 'Seeker'}</span>
            </div>
          </div>

          {/* Artwork square with red border */}
          <div className="mt-6">
            <div className="mx-auto w-[78%]">
  <div className="rounded-[12px]" style={{ borderColor: 'rgba(229,9,20,0.35)', boxShadow: 'inset 0 0 0 2px rgba(229,9,20,.32), 0 0 110px rgba(229,9,20,.32), 0 0 40px rgba(229,9,20,.24)' }}>
    <div className="rounded-[12px] overflow-hidden aspect-square bg-[#050505] border border-white/10 grid place-items-center">
      {pfp ? (
        <img src={pfp} crossOrigin="anonymous" className="block w-full h-full object-cover" />
      ) : (
        <span className="text-white/50">PFP</span>
      )}
    </div>
  </div>
</div>

<div className="flex-1" /></div>

          {/* Info block */}
          <div className="mt-2 rounded-xl bg-white/5 border border-white/10 p-5 w-[70%] self-center">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-lg grid place-items-center bg-white/10 ring-1 ring-white/15">
                <img src="/anoma-logo.svg" className="w-8 h-8" />
              </div>
              <div>
                <div className="font-semibold text-lg">Anoma Community</div>
                <div className="text-base text-white/60">Card generated from your MG pfp.</div>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {tw && (
                <div className="flex items-center gap-3 text-white">
                 <div className="w-12 h-12 rounded-full grid place-items-center"
     style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.25)' }}>
  <img src="/icons/x-logo.png" alt="X logo" className="w-6 h-6" />
</div>

                  <span className="text-xl font-semibold tracking-wide">{tw}</span>
                </div>
              )}
              {dc && (
                <div className="flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-full grid place-items-center"
     style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.25)' }}>
  <img src="/icons/discord.png" alt="Discord logo" className="w-7 h-7" />
</div>

                  <span className="text-xl font-semibold tracking-wide">{dc}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer micro brand */}
          <div className="mt-1 flex items-center justify-between text-base text-white/50 pt-1">
            <span>crafted for Anoma</span>
            <span>MG community card</span>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function App() {
  // UI tabs
  const [activeTab, setActiveTab] = useState<'generator' | 'community'>('generator')

  // Community Wall state (in-memory until Supabase)
  type CommunityItem = { id: string; url: string; created_at: number }

  const [communityItems, setCommunityItems] = useState<CommunityItem[]>([])
  const [pfp, setPfp] = useState<string | null>(null)
  const [tw, setTw] = useState('')
  const [dc, setDc] = useState('')
  const [badge, setBadge] = useState('')

  
  function handlePreviewUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    const allowedExt = new Set(['png','jpg','jpeg']);
    const allowedMime = ['image/png','image/jpeg'];
    if (!allowedExt.has(ext) || !allowedMime.includes(f.type)) {
      alert('Only PNG, JPG, JPEG files are allowed.');
      e.target.value = '';
      return;
    }
    if (typeof fileToDataUrl === 'function') {
      const _p = fileToDataUrl(f);
      if (_p && typeof (_p as any).then === 'function') {
        (_p as Promise<string>).then((dataUrl) => setPfp(dataUrl));
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => setPfp(String(reader.result || ''));
      reader.readAsDataURL(f);
    }
    e.target.value = '';
  }
async function handleCommunityUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const watermarked = await watermarkImage(f)
    const url = URL.createObjectURL(watermarked)
    setCommunityItems(prev => [{ id: String(Date.now()), url, created_at: Date.now() }, ...prev])
    e.target.value = ''
  }

  const fileRef = useRef<HTMLInputElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const exportRef = useRef<HTMLDivElement>(null)

  
  async function waitForImages(root: HTMLElement) {
    const imgs = Array.from(root.querySelectorAll('img'));
    await Promise.all(imgs.map(img => {
      return img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          });
    }));
  }
const ready = useMemo(() => Boolean(pfp && (tw || dc)), [pfp, tw, dc])

  function ensureAt(v: string) {
    if (!v) return ''
    const noSpaces = v.replace(/\s+/g, '')
    if (noSpaces[0] !== '@') return '@' + noSpaces.replace(/^@+/, '')
    // collapse multiple @@@ -> @
    return '@' + noSpaces.replace(/^@+/, '')
  }

  async function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image (PNG/JPG/WEBP).')
      return
    }
    const dataUrl = await fileToDataUrl(file)
    setPfp(dataUrl)
  }

  async function onDownload() {
    // ensure images inside export card are loaded
    if (exportRef.current) { await waitForImages(exportRef.current); }
    if (!exportRef.current) return
    try {
      const dataUrl = await toPng(exportRef.current, {
width: CARD_W,
        height: CARD_H,
        backgroundColor: '#0b0b0b',
        cacheBust: true,
        pixelRatio: 1,
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `anoma-card-${Date.now()}.png`
      a.click()
    } catch (e) {
      console.error(e)
      alert('Export failed.')
    }
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(180deg,#0A0A0A 0%,#050505 100%)' }}>
      {/* HEADER */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <img src="/anoma-logo.svg" className="h-8 w-auto" alt="Anoma" />
    <div>
      <h1 className="text-lg font-semibold">Anoma Card For Community.</h1>
      <p className="text-xs text-white/60">Create anoma card with your MG pfp.</p>
    </div>
  </div>

  <nav className="flex items-center gap-3 bg-white/10 rounded-full px-3 py-1 backdrop-blur-sm ring-1 ring-white/10">
    <a href="/" className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition">Generator</a>
    <span className="text-white/50 select-none">|</span>
    <a href="/community" className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition">Community Wall</a>
  </nav>
</header>

      {activeTab === 'generator' && (<main className="max-w-6xl mx-auto px-6 grid lg:grid-cols-[520px_1fr] items-start gap-10 pb-24">
        {/* Controls */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">1) Profile Image</h2>
            <p className="text-sm text-white/60">PNG/JPG/JPEG. Square image recommended.</p>
            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-black hover:bg-zinc-200">
                <ImageUp className="size-4" /> Upload Image
              </button>
              <button onClick={() => { setPfp(null); setTw(''); setDc(''); setBadge(''); }} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 hover:bg-white/10">Clear
	      </button>

              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg" className="hidden" onChange={handlePreviewUpload}/>
            </div>
            {pfp && (
              <div className="mt-2 flex items-center gap-4">
                <img src={pfp} crossOrigin="anonymous" className="size-16 rounded-xl object-cover ring-1 ring-white/15" />
                <p className="text-sm text-white/70">Uploaded ✓</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold">2) Details</h2>
            <div className="grid gap-3">
              <input value={tw} onChange={(e) => setTw(ensureAt(e.target.value))} placeholder="Twitter username (e.g. @emir_ethh)" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"/>
              <input value={dc} onChange={(e) => setDc(ensureAt(e.target.value))} placeholder="Discord username (e.g. @emirkostik)" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"/>
              <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Badge (e.g. master)" className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"/>
            </div>
          </div>

          <p className="text-xs text-white/50">Upload PFP + at least one username.</p>
        </section>

        {/* Preview */}
        <section className="space-y-4">
          <div className="w-full mx-auto" style={{ width: PREVIEW_VIEW_W }}>
            <div className="flex items-center justify-between">
            <h3 className="text-sm tracking-wider text-white/60">Preview</h3>
            <button onClick={onDownload} disabled={!ready} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 hover:bg-white/10 disabled:opacity-50">
              <Download className="size-4" /> Download PNG
            </button>
          </div>
          </div>

          <div>
  <div className="w-full grid place-items-center">
    {/* Wrapper: gerçek layout yüksekliğini PREVIEW_SCALE kadar yap */}
    <div
      className="relative w-full"
      style={{
        width: PREVIEW_VIEW_W,
        height: Math.round(CARD_H * PREVIEW_SCALE)
      }}
    >
      {/* İçerideki kart: mutlak konum + scale; layout’a yükseklik yazdırmaz */}
      <div
        className="absolute top-0 left-0"
        style={{
          width: CARD_W,
          height: CARD_H,
          transform: `scale(${PREVIEW_SCALE})`,
          transformOrigin: 'top left'
        }}
      >
        <Card
          ref={previewRef}
          pfp={pfp}
          tw={tw}
          dc={dc}
          badge={badge}
          fixed
        />
      </div>
    </div>
  </div>
</div>


          {/* Offscreen export node (exact pixels) */}
          <div style={{ position: 'fixed', left: -99999, top: 0, opacity: 0, pointerEvents: 'none' }} aria-hidden>
            <Card ref={exportRef} pfp={pfp} tw={tw} dc={dc} badge={badge} fixed />
          </div>
        </section>
      </main>)}
{activeTab === 'community' && (
  <main className="w-full">
    <section className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Community Wall</h2>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 cursor-pointer hover:bg-white/10">
          <input type="file" accept="image/*" onChange={handleCommunityUpload} className="hidden" />
          <ImageUp className="w-4 h-4" />
          <span className="text-sm">Upload to Wall</span>
        </label>
      </div>
      <p className="text-sm text-white/60 mb-4">Users' uploads are watermarked with <span className="font-semibold">DO NOT USE</span> automatically.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {communityItems.map(item => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="group relative block overflow-hidden rounded-2xl border border-white/10">
            <img src={item.url} alt="community upload" className="w-full h-40 object-cover group-hover:scale-105 transition" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </a>
        ))}
        {communityItems.length === 0 && (
          <div className="col-span-full text-center text-white/60 text-sm py-8">No posts yet. Be the first to upload!</div>
        )}
      </div>
    </section>
  </main>
)}


      {/* FOOTER */}
<footer className="w-full py-6 flex justify-center">
  <a
    href="https://x.com/emir_ethh"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center gap-2 bg-white text-black rounded-full shadow-md px-10 md:px-14 py-3 whitespace-nowrap min-w-[340px]"
  >
    <span className="text-sm">Powered by</span>
    <img
      src="/icons/x-logo-black.png"
      alt="X Logo"
      width={18}
      height={18}
      className="shrink-0 mx-1"
    />
    <span className="font-semibold">Emir.Eth</span>
  </a>
</footer>
    </div>
  )
}
