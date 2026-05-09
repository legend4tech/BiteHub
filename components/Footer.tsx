export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-14 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl grid place-items-center text-primary-foreground font-bold" style={{ background: "var(--gradient-primary)" }}>C</div>
            <span className="font-heading text-xl font-bold">Campus<span className="text-primary">Bites</span></span>
          </div>
          <p className="text-sm text-muted-foreground mt-4 max-w-xs">
            Campus food ordering, made delightful. Built for COOU Uli students and vendors.
          </p>
        </div>
        <FooterCol title="Product" links={["Vendors", "Menu", "How it works", "Pricing"]} />
        <FooterCol title="Company" links={["About", "Careers", "Contact", "Press"]} />
        <FooterCol title="Legal" links={["Privacy", "Terms", "Cookies"]} />
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} CampusBites. Crafted on campus.</p>
        
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <p className="font-semibold text-sm">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l}><a href="#" className="hover:text-primary transition-colors">{l}</a></li>
        ))}
      </ul>
    </div>
  );
}
