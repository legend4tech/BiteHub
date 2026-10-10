"use client"

import { useState } from "react"
import { toast } from "sonner"
import { TipTapEditor } from "@/components/admin/TipTapEditor"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Users, PenTool, Type, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

export function BroadcastForm() {
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [audiences, setAudiences] = useState({
    customers: false,
    vendors: false,
    subscribers: true,
  })
  const [isSending, setIsSending] = useState(false)

  const handleAudienceChange =
    (key: keyof typeof audiences) => (checked: boolean) => {
      setAudiences((prev) => ({ ...prev, [key]: checked }))
    }

  const allSelected =
    audiences.customers && audiences.vendors && audiences.subscribers
  const someSelected =
    audiences.customers || audiences.vendors || audiences.subscribers

  const handleSelectAll = (checked: boolean) => {
    setAudiences({
      customers: checked,
      vendors: checked,
      subscribers: checked,
    })
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are required")
      return
    }

    if (!someSelected) {
      toast.error("Please select at least one audience")
      return
    }

    setIsSending(true)
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          content,
          audiences,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send broadcast")

      toast.success("Broadcast queued successfully!")
      setSubject("")
      setContent("")
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="space-y-8">
      <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Target Audience</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Select who should receive this broadcast.
          </p>
        </div>
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 p-4">
            <div>
              <Label className="text-base font-medium">Send to Everyone</Label>
              <p className="text-sm text-muted-foreground">
                Quickly select all available groups.
              </p>
            </div>
            <Switch checked={allSelected} onCheckedChange={handleSelectAll} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all hover:bg-accent/50",
                audiences.customers
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Customers</span>
                <Checkbox
                  checked={audiences.customers}
                  onCheckedChange={handleAudienceChange("customers")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                All registered campus foodies
              </p>
            </label>

            <label
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all hover:bg-accent/50",
                audiences.vendors
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Vendors</span>
                <Checkbox
                  checked={audiences.vendors}
                  onCheckedChange={handleAudienceChange("vendors")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Active food sellers and managers
              </p>
            </label>

            <label
              className={cn(
                "flex cursor-pointer flex-col gap-3 rounded-xl border p-4 transition-all hover:bg-accent/50",
                audiences.subscribers
                  ? "border-primary bg-primary/5"
                  : "border-border"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Subscribers</span>
                <Checkbox
                  checked={audiences.subscribers}
                  onCheckedChange={handleAudienceChange("subscribers")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Newsletter and update subscribers
              </p>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Message Content</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Compose your email broadcast.
          </p>
        </div>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label
              htmlFor="subject"
              className="flex items-center gap-2 text-sm font-medium"
            >
              <Type className="h-4 w-4 text-muted-foreground" />
              Subject Line
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Big updates coming to BiteHub!"
              required
              className="h-12 rounded-xl text-base"
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              Email Body
            </Label>
            <TipTapEditor value={content} onChange={setContent} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="lg"
          disabled={
            isSending || !someSelected || !subject.trim() || !content.trim()
          }
          className="h-12 gap-2 rounded-xl px-8"
        >
          {isSending ? (
            <div className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Send className="size-4" />
          )}
          {isSending ? "Sending Broadcast..." : "Send Broadcast"}
        </Button>
      </div>
    </form>
  )
}
