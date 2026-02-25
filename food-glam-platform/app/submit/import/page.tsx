'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
// import { Input } from '@/components/ui/input'

export default function ImportRecipePage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [extracted, setExtracted] = useState<any>(null)

  const handleImport = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/import/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      setExtracted(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen container mx-auto px-4 py-8" style={{ background: 'linear-gradient(to bottom, #fdf8f0, #ffffff)', color: '#111' }}>
      <h1 className="text-3xl font-bold mb-4">Import Recipe from URL</h1>
      <div className="flex gap-2 mb-4">
        <input 
          type="text"
          value={url}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
          placeholder="Paste recipe URL here..."
          className="flex-1 px-3 py-2 border rounded-md"
        />
        <Button onClick={handleImport} disabled={loading}>
          {loading ? 'Importing...' : 'Import'}
        </Button>
      </div>
      {extracted && (
        <div className="bg-card p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Extracted Recipe</h2>
          <pre className="text-sm">{JSON.stringify(extracted, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
