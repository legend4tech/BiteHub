import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME, APP_LOGO_URL } from "@/lib/constants";


interface AuthPanelFeature {
  icon: LucideIcon;
  text: string;
}

interface AuthPanelProps {
  /** "vendor" = orange gradient, "admin" = dark slate */
  variant?: "vendor" | "admin";
  bgImage?: string;
  badge?: string;
  badgeIcon?: LucideIcon;
  headline: string;
  subline: string;
  features: AuthPanelFeature[];
  footerText: string;
  footerIcon?: LucideIcon;
}

export function AuthPanel({
  variant = "vendor",
  bgImage,
  badge,
  badgeIcon: BadgeIcon,
  headline,
  subline,
  features,
  footerText,
  footerIcon: FooterIcon,
}: AuthPanelProps) {
  const isAdmin = variant === "admin";

  return (
    <div
      className={cn(
        "hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col p-12 overflow-hidden",
        !bgImage && isAdmin && "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        !bgImage && !isAdmin && "bg-gradient-to-br from-primary via-orange-500 to-amber-500"
      )}
    >
      {/* ── Background Image & Overlay ── */}
      {bgImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center z-0" 
            style={{ backgroundImage: `url(${bgImage})` }} 
          />
          <div 
            className={cn(
              "absolute inset-0 z-0",
              isAdmin ? "bg-slate-900/90" : "bg-gradient-to-br from-primary/90 via-orange-600/80 to-amber-600/90"
            )} 
          />
        </>
      )}

      {/* ── Decorative blobs / lines ── */}
      {!bgImage && isAdmin && (
        <>
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-primary/5 blur-3xl pointer-events-none z-0" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] z-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Accent lines */}
          <div className="absolute top-1/3 left-1/4 w-px h-48 bg-gradient-to-b from-transparent via-primary/30 to-transparent z-0" />
          <div className="absolute top-1/2 right-1/4 w-px h-32 bg-gradient-to-b from-transparent via-orange-500/20 to-transparent z-0" />
        </>
      )}
      {!bgImage && !isAdmin && (
        <>
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none z-0" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-black/10 blur-3xl pointer-events-none z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/5 blur-3xl pointer-events-none z-0" />
        </>
      )}

      {/* ── Brand ── */}
      <Link href="/" className="relative z-10 flex items-center gap-2.5 group w-fit">
        <img 
          src={APP_LOGO_URL} 
          alt={APP_NAME} 
          className="h-12 w-auto object-contain rounded-xl transition-all duration-300 group-hover:scale-105 group-hover:-rotate-2" 
        />
        <div className="flex flex-col -space-y-1">
          <span className="font-heading font-black text-2xl tracking-tight text-white leading-none">
            BiteHub
          </span>
        </div>
      </Link>

      {/* ── Centre content ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center mt-12">
        {/* Badge */}
        {badge && (
          <div className="mb-4">
            <span
              className={cn(
                "inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest rounded-full px-3 py-1",
                isAdmin
                  ? "text-primary bg-primary/10 border border-primary/20"
                  : "text-white/90 bg-white/15 backdrop-blur-sm"
              )}
            >
              {BadgeIcon && <BadgeIcon className="size-3" />}
              {badge}
            </span>
          </div>
        )}

        {/* Headline */}
        <h2
          className={cn(
            "font-heading text-4xl xl:text-5xl font-bold leading-tight mt-2",
            isAdmin ? "text-white" : "text-white"
          )}
          dangerouslySetInnerHTML={{ __html: headline }}
        />
        <p
          className={cn(
            "mt-4 text-base leading-relaxed max-w-md",
            isAdmin ? "text-slate-400" : "text-white/80"
          )}
        >
          {subline}
        </p>

        {/* Features */}
        <div className="space-y-4 mt-8">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div
                className={cn(
                  "h-9 w-9 rounded-xl grid place-items-center shrink-0",
                  isAdmin
                    ? "bg-slate-700/60 border border-slate-600/50"
                    : "bg-white/15 backdrop-blur-sm"
                )}
              >
                <Icon className={cn("size-4.5", isAdmin ? "text-slate-300" : "text-white")} />
              </div>
              <span className={cn("text-sm font-medium", isAdmin ? "text-slate-400" : "text-white/90")}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer badge ── */}
      <div className="relative z-10 mt-12">
        <div
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium",
            isAdmin
              ? "bg-slate-700/50 border border-slate-600/50 text-slate-400"
              : "bg-white/15 backdrop-blur-sm text-white"
          )}
        >
          {FooterIcon && <FooterIcon className={cn("size-3.5", isAdmin ? "text-primary" : "text-white")} />}
          {!FooterIcon && <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />}
          {footerText}
        </div>
      </div>
    </div>
  );
}
