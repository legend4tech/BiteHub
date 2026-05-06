"use client";

import React, { Component, ReactNode } from "react";
import { FetchError } from "./FetchError";

interface Props {
  children: ReactNode;
  title?: string;
  message?: string;
  /** Wrap the fallback in a section-like container to preserve layout spacing */
  padded?: boolean;
}

interface State {
  hasError: boolean;
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
export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[SectionErrorBoundary]", error.message, info.componentStack);
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
          onRetry={() => this.setState({ hasError: false })}
        />
      );

      // padded: one single py-16 wrapping — no double spacing
      return this.props.padded ? (
        <section className="py-16 flex items-center justify-center px-6">
          {inner}
        </section>
      ) : (
        <div className="flex items-center justify-center py-10 px-6">{inner}</div>
      );
    }

    return this.props.children;
  }
}
