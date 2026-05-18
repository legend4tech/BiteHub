"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
  value?: { url: string; publicId: string } | string;
  onChange: (value: { url: string; publicId: string } | null) => void;
  type: "vendor" | "menu";
}

export function ImageUpload({ value, onChange, type }: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedPublicIdsRef = useRef<Set<string>>(new Set());

  // Normalize value to object or string
  const currentUrl = typeof value === "string" ? value : value?.url;

  const handleUpload = async (file: File) => {
    // Restrict to 1.5MB
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error("File is too large. Max size is 1.5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      uploadedPublicIdsRef.current.add(data.publicId);

      onChange({
        url: data.imageUrl,
        publicId: data.publicId,
      });
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  const handleRemove = async () => {
    const currentPublicId = typeof value === "string" ? null : value?.publicId;
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (currentPublicId && uploadedPublicIdsRef.current.has(currentPublicId)) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: currentPublicId }),
        });
        uploadedPublicIdsRef.current.delete(currentPublicId);
      } catch (error) {
        console.error("Failed to delete freshly uploaded image:", error);
      }
    }
  };

  return (
    <div className="space-y-4 w-full">
      {currentUrl ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border group">
          <Image
            src={currentUrl}
            alt="Preview"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
          className={`relative w-full aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 transition-colors ${
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
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="size-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  SVG, PNG, JPG or WEBP (max. 1.5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
