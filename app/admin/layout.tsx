/**
 * Admin layout — pass-through wrapper.
 * Individual admin pages use `fixed inset-0` for their full-screen shell,
 * which pins them to the viewport regardless of body/ThemeProvider wrapper heights.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
