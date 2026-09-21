"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Image as ImageIcon } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: { url: string; publicId: string; file?: File } | string | null
  onChange: (
    value: { url: string; publicId: string; file?: File } | null
  ) => void
  type: "vendor" | "menu" | "customer"
}

export function ImageUpload({ value, onChange, type }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Normalize value to object or string
  const currentUrl = typeof value === "string" ? value : value?.url

  // Clean up Object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (currentUrl && currentUrl.startsWith("blob:")) {
        URL.revokeObjectURL(currentUrl)
      }
    }
  }, [currentUrl])

  const handleFile = (file: File) => {
    // Restrict to 1.5MB
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 1.5MB")
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file")
      return
    }

    // Revoke old object URL if we had a local preview
    if (currentUrl && currentUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentUrl)
    }

    // Create a local Object URL for instant preview
    const previewUrl = URL.createObjectURL(file)

    onChange({
      file,
      url: previewUrl,
      publicId: "",
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    if (currentUrl && currentUrl.startsWith("blob:")) {
      URL.revokeObjectURL(currentUrl)
    }
    onChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full space-y-4">
      {currentUrl ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-xl border border-border">
          <Image src={currentUrl} alt="Preview" fill className="object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
              className="rounded-full"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Upload className="size-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                SVG, PNG, JPG or WEBP (max. 1.5MB)
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
