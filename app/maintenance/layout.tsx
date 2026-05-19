export const metadata = {
  title: "Under Maintenance - BiteHub",
  description: "BiteHub is currently undergoing scheduled maintenance.",
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
