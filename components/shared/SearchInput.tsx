"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchInputProps {
  placeholder?: string
  className?: string
}

export function SearchInput({
  placeholder = "Search...",
  className,
}: SearchInputProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)
    if (query.trim()) {
      params.set("q", query.trim())
    } else {
      params.delete("q")
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSearch}
      className={
        className ||
        "flex w-full max-w-2xl items-center gap-2 sm:min-w-[400px] md:min-w-[500px]"
      }
    >
      <div className="relative flex-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
        <Input
          type="search"
          placeholder={placeholder}
          className="h-[42px] w-full rounded-full border-border pl-10"
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
        />
      </div>
      <Button
        type="submit"
        variant="hero"
        className="h-[42px] shrink-0 rounded-full px-6 shadow-lg shadow-primary/20"
      >
        Search
      </Button>
    </form>
  )
}
