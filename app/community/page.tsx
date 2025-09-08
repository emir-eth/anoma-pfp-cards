'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ImageUp } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import styles from './viewer-close.module.css'

type Item = { id: string; username: string; url: string; created_at: number }

export default function CommunityPage() {
  const [username, setUsername] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [items, setItems] = useState<Item[]>([])

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerItem, setViewerItem] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)

  async function refreshItems() {
    const { data, error } = await supabase
      .from('community_items')
      .select('id, username, image_path, created_at')
      .order('created_at', { ascending: false })
      .limit(60)

    if (!error && data) {
      setItems(
        data.map((d: any) => ({
          id: String(d.id),
          username: d.username || 'anon',
          url: d.image_path,
          created_at: new Date(d.created_at).getTime(),
        }))
      )
    }
  }

  useEffect(() => { refreshItems() }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setSubmitting(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await supabase.storage.from('images').upload(name, file, { upsert: false })
      if (upErr) throw upErr
      const { error: insErr } = await supabase.from('community_items').insert({ username: username || 'anon', image_path: name })
      if (insErr) throw insErr
      await refreshItems()
      setUsername('')
      setFile(null)
    } finally {
      setSubmitting(false)
    }
  }

  const openViewer = (item: Item) => { setViewerItem(item); setViewerOpen(true); setLoading(true) }
  const closeViewer = () => { setViewerOpen(false); setViewerItem(null); setLoading(false) }

  useEffect(() => {
    if (!viewerOpen || !viewerItem) return
    setLoading(true)
  }, [viewerOpen, viewerItem])

  return (
    <div className="min-h-screen flex flex-col select-none" style={{ WebkitUserSelect: 'none', userSelect: 'none' }}>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-6 pb-24">

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

          {/* PAGE TITLE (sol hizalı) */}
          <h2 className="text-3xl font-bold text-white mt-8 mb-6 md:mt-10 md:mb-8">
            Community Wall
          </h2>

          <form className="rounded-2xl border border-white/10 p-6 bg-gradient-to-b from-white/5 to-transparent" onSubmit={onSubmit}>
            <div className="grid md:grid-cols-[1fr,auto] gap-4 items-center">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="rounded-xl bg-black/40 border border-white/10 px-4 py-2 outline-none"
                placeholder="@yourhandle"
                maxLength={40}
              />
              <div className="flex items-center gap-3">
                <input type="file" accept="image/jpeg,image/png" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                <button
                  className="rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2 disabled:opacity-50"
                  disabled={!file || submitting}
                  type="submit"
                >
                  <span className="inline-flex items-center gap-2"><ImageUp size={16}/> Add to Community Wall</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-white/50 mt-2">Note: Images are stored privately in Supabase Storage and always shown with a watermark.</p>
          </form>

          <h3 className="text-lg font-semibold mt-8 mb-3">Latest submissions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.length === 0 && (<p className="text-white/60">No uploads yet. Be the first!</p>)}
            {items.map(item => {
              const src = `/api/wm?path=${encodeURIComponent(item.url)}&fill=0.28&stroke=0.85`;
              return (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <button className="block w-full" onClick={() => openViewer(item)} onContextMenu={(e) => e.preventDefault()}>
                    {/* SABİT ORAN + CONTAIN */}
                    <div className="aspect-[16/9] bg-black/30">
                      <img
                        src={src}
                        alt={item.username || 'item'}
                        className="w-full h-full object-contain block"
                        draggable={false}
                        loading="lazy"
                      />
                    </div>
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-black/40 backdrop-blur-sm px-3 py-2 text-xs">
                    <span className="opacity-80">{item.username}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      {viewerOpen && viewerItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onContextMenu={(e)=>e.preventDefault()}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeViewer(); }}
        >
          <div className="relative">
            <button
              onClick={closeViewer}
              className="absolute -top-5 -right-4 rounded-full bg-white text-black px-3 py-1 text-sm shadow-lg z-50"
            >
              Close
            </button>

            <div className="relative inline-block rounded-2xl border border-white/20 bg-black/30 overflow-hidden">
              <img
                src={`/api/wm?path=${encodeURIComponent(viewerItem.url)}`}
                alt={viewerItem.username || 'image'}
                className="block max-w-[90vw] max-h-[85vh] w-auto h-auto object-contain"
                onLoad={() => setLoading(false)}
                onError={() => setLoading(false)}
                draggable={false}
              />
              {loading && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="animate-pulse text-sm bg-white text-black rounded-full px-4 py-2 inline-block">Loading...</div>
                </div>
              )}
            </div>
          </div>
        </div>
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
