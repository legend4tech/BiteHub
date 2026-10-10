"use client"

import { useEditor, EditorContent, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  ImageIcon,
  Unlink,
  Heading1,
  Heading2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TipTapEditorProps {
  value: string
  onChange: (value: string) => void
}

const MenuBar = ({ editor }: { editor: Editor }) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")

  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("")

  if (!editor) return null

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes("link").href || ""
    setLinkUrl(previousUrl)
    setIsLinkModalOpen(true)
  }

  const handleApplyLink = () => {
    if (linkUrl === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run()
    }
    setIsLinkModalOpen(false)
  }

  const openImageModal = () => {
    setIsImageModalOpen(true)
  }

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const MAX_FILE_SIZE_MB = 2
      const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `Image is too large. Please select an image under ${MAX_FILE_SIZE_MB}MB.`
        )
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      setSelectedImageFile(file)
      setImagePreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleUploadImage = async () => {
    if (!selectedImageFile) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedImageFile)
      formData.append("type", "broadcast")

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      editor.chain().focus().setImage({ src: data.imageUrl }).run()

      handleCancelImage()
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancelImage = () => {
    setIsImageModalOpen(false)
    setSelectedImageFile(null)
    setImagePreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-xl border-b border-border bg-muted/30 p-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
          editor.isActive("bold")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Bold"
      >
        <Bold className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
          editor.isActive("italic")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Italic"
      >
        <Italic className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50",
          editor.isActive("strike")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Strike"
      >
        <Strikethrough className="size-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground",
          editor.isActive("heading", { level: 1 })
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Heading 1"
      >
        <Heading1 className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground",
          editor.isActive("heading", { level: 2 })
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Heading 2"
      >
        <Heading2 className="size-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-border" />

      <button
        type="button"
        onClick={openLinkModal}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground",
          editor.isActive("link")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Add Link"
      >
        <LinkIcon className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Remove Link"
      >
        <Unlink className="size-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-border" />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground",
          editor.isActive("bulletList")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Bullet List"
      >
        <List className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground",
          editor.isActive("orderedList")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Ordered List"
      >
        <ListOrdered className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "rounded-lg p-2 transition-all hover:bg-accent hover:text-accent-foreground",
          editor.isActive("blockquote")
            ? "bg-accent text-accent-foreground shadow-sm"
            : "text-muted-foreground"
        )}
        title="Quote"
      >
        <Quote className="size-4" />
      </button>

      <div className="mx-1 h-6 w-px bg-border" />

      <button
        type="button"
        onClick={openImageModal}
        disabled={isUploading}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="Insert Image"
      >
        <ImageIcon className={cn("size-4", isUploading && "animate-pulse")} />
      </button>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        <Undo className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
      >
        <Redo className="size-4" />
      </button>

      {/* Link Modal */}
      <Dialog
        open={isLinkModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsLinkModalOpen(false)
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Insert Link</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleApplyLink()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyLink}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog
        open={isImageModalOpen}
        onOpenChange={(open) => {
          if (!open && !isUploading) handleCancelImage()
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!imagePreviewUrl ? (
              <div
                className="cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select an image
                </p>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="h-auto max-h-[300px] w-full bg-muted/20 object-contain"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedImageFile(null)
                    setImagePreviewUrl("")
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  disabled={isUploading}
                >
                  Remove
                </Button>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileSelect}
              accept="image/*"
              className="hidden"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelImage}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUploadImage}
              disabled={isUploading || !selectedImageFile}
            >
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function TipTapEditor({ value, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 cursor-pointer",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class:
            "rounded-lg max-w-full h-auto shadow-md border border-border my-4",
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert sm:prose-base focus:outline-none min-h-[300px] max-h-[600px] overflow-y-auto p-5 bg-background rounded-b-xl",
        "data-lenis-prevent": "true",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  useEffect(() => {
    if (editor && value === "") {
      editor.commands.setContent("")
    }
  }, [value, editor])

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
