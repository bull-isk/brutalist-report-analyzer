import type React from "react"
import { cn } from "../../utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

const Button: React.FC<ButtonProps> = ({ className, variant = "primary", size = "md", children, ...props }) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium tracking-wide transition-all duration-300",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-blue-500/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",

        // Variants
        variant === "primary" &&
        "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border border-blue-400/30 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]",
        variant === "outline" &&
        "bg-slate-900/40 hover:bg-slate-800/80 border border-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:text-white backdrop-blur-sm shadow-sm",
        variant === "ghost" &&
        "text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]",

        // Sizes
        size === "sm" && "text-xs px-3 py-1.5 rounded-md",
        size === "md" && "text-sm px-4 py-2.5",
        size === "lg" && "text-sm px-6 py-3",

        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button