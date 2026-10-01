"use client"

import Image from "next/image"
import { motion } from "framer-motion"

interface UserRankBadgeProps {
  coins: number
}

export function UserRankBadge({ coins }: UserRankBadgeProps) {
  // Determine rank based on BHC balance
  let rank = "Bronze Foodie"
  let imageSrc = "/avatars/bronze.png"
  let colorClass =
    "from-amber-600/20 to-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-500/30"

  if (coins >= 5000) {
    rank = "Gold Connoisseur"
    imageSrc = "/avatars/gold.png"
    colorClass =
      "from-yellow-400/20 to-yellow-600/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
  } else if (coins >= 1000) {
    rank = "Silver Gourmand"
    imageSrc = "/avatars/silver.png"
    colorClass =
      "from-slate-400/20 to-slate-600/20 text-slate-700 dark:text-slate-300 border-slate-400/30"
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`relative flex items-center gap-2 overflow-hidden rounded-full border bg-gradient-to-r p-1.5 pr-4 shadow-sm backdrop-blur-sm ${colorClass}`}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 z-0 animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* 3D Avatar */}
      <div className="relative z-10 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-background shadow-inner">
        <Image
          src={imageSrc}
          alt={rank}
          width={40}
          height={40}
          className="object-cover"
        />
      </div>

      {/* Rank Text */}
      <div className="relative z-10 flex flex-col">
        <span className="text-[10px] font-black tracking-widest uppercase opacity-80">
          Rank
        </span>
        <span className="text-sm leading-tight font-bold">{rank}</span>
      </div>
    </motion.div>
  )
}
