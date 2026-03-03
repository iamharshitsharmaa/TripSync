import { useRef, useState } from 'react'
import api from '../lib/axios'
import toast from 'react-hot-toast'

export default function FileUpload({ tripId, onUpload }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post(
        `/upload/trip/${tripId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      onUpload?.(data.data)
      toast.success('File uploaded!')
    } catch (err) {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = '' // reset file input
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,.pdf"
        onChange={handleFile}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-500 disabled:opacity-50"
      >
        {uploading ? 'Uploading...' : '📎 Attach file'}
      </button>
    </div>
  )
}