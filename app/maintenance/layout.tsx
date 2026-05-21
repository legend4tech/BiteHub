import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Maintenance",
  description: "BiteHub is currently undergoing scheduled maintenance. We'll be back shortly!",
  robots: { index: false, follow: false },
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      {children}
    </div>
  );
}
