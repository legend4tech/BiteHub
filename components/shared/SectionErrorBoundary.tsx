"use client"

import React, { Component, ReactNode, startTransition } from "react"
import { useRouter } from "next/navigation"
import { FetchError } from "./FetchError"

interface Props {
  children: ReactNode
  title?: string
  message?: string
  /** Wrap the fallback in a section-like container to preserve layout spacing */
  padded?: boolean
}

interface InnerProps extends Props {
  router: ReturnType<typeof useRouter>
}

interface State {
  hasError: boolean
}

/**
 * Inline error boundary for data-fetching sections.
 * Only the section that fails shows the error — surrounding UI stays intact.
 *
 * Usage:
 *   <SectionErrorBoundary title="Couldn't load menus">
 *     <Suspense fallback={<Skeleton />}>
 *       <AsyncDataComponent />
 *     </Suspense>
 *   </SectionErrorBoundary>
 */
class SectionErrorBoundaryInner extends Component<InnerProps, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SectionErrorBoundary]", error.message, info.componentStack)
  }

  handleRetry = () => {
    startTransition(() => {
      this.props.router.refresh()
      this.setState({ hasError: false })
    })
  }

  render() {
    if (this.state.hasError) {
      const inner = (
        <FetchError
          size="md"
          title={this.props.title ?? "Couldn't load this section"}
          message={
            this.props.message ??
            "Something went wrong while loading. Check your connection and try again."
          }
          onRetry={this.handleRetry}
        />
      )

      // padded: one single py-16 wrapping — no double spacing
      return this.props.padded ? (
        <section className="flex items-center justify-center px-6 py-16">
          {inner}
        </section>
      ) : (
        <div className="flex items-center justify-center px-6 py-10">
          {inner}
        </div>
      )
    }

    return this.props.children
  }
}

export function SectionErrorBoundary(props: Props) {
  const router = useRouter()
  return <SectionErrorBoundaryInner {...props} router={router} />
}
