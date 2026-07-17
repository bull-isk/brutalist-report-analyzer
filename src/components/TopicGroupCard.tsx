"use client"

import type React from "react"
import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Hash,
  Globe,
  Clock,
  FileText,
  ImageIcon,
  AlertTriangle,
  ExternalLinkIcon,
  AlertCircle,
  Info,
} from "lucide-react"
import { cn } from "../utils"
import type { TopicGroup } from "../types/analysis"

interface TopicGroupCardProps {
  group: TopicGroup
  isExpanded: boolean
  onToggle: () => void
}

const TopicGroupCard: React.FC<TopicGroupCardProps> = ({ group, isExpanded, onToggle }) => {
  // Group headlines by source
  const headlinesBySource: Record<string, Array<{ title: string; url: string; time?: string }>> = {}
  const [imageError, setImageError] = useState(false)

  group.headlines.forEach((headline) => {
    if (!headlinesBySource[headline.source]) {
      headlinesBySource[headline.source] = []
    }
    headlinesBySource[headline.source].push({
      title: headline.title,
      url: headline.url,
      time: headline.time,
    })
  })

  // Count sources and articles
  const sourceCount = Object.keys(headlinesBySource).length
  const headlineCount = group.count || group.headlines.length

  // Check if we have a successful image or error information
  const hasSuccessfulImage = group.image && group.image.url && !group.image.error
  const hasImageError = group.image && group.image.error
  const shouldShowImageContainer = hasSuccessfulImage || hasImageError

  return (
    <div
      className={cn(
        "relative flex flex-col h-full overflow-hidden rounded-xl transition-all duration-300 border backdrop-blur-md shadow-lg",
        isExpanded
          ? "bg-slate-900/60 border-blue-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.5)] z-10"
          : "bg-slate-900/40 border-white/[0.05] hover:bg-slate-900/50 hover:border-white/[0.1] hover:shadow-xl"
      )}
    >
      {/* Header - Always visible */}
      <div
        className="p-5 flex items-start sm:items-center justify-between cursor-pointer transition-colors duration-300 hover:bg-white/[0.02] border-b border-white/[0.05] relative z-10 gap-4"
        onClick={onToggle}
      >
        <div className="flex items-center relative flex-1 min-w-0">
          <div className="bg-blue-500/10 p-1.5 rounded-lg mr-3 shadow-[0_0_10px_rgba(59,130,246,0.1)] flex-shrink-0 transition-transform duration-300">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-blue-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-blue-400" />
            )}
          </div>
          <h3 className="font-medium text-slate-200 tracking-wide truncate pr-2 text-base">
            {group.topic_name}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-xs font-medium text-slate-400">
            <Globe className="h-3 w-3 text-blue-400/70" />
            <span>{sourceCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.05] text-xs font-medium text-slate-400">
            <FileText className="h-3 w-3 text-indigo-400/70" />
            <span>{headlineCount}</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          EXPERIMENTAL FEATURE: Real Article Image Header with Error Display
          ===================================================================== */}
      {shouldShowImageContainer && (
        <div className="relative h-44 overflow-hidden border-b border-white/[0.05] shrink-0 bg-slate-950/50">
          {hasSuccessfulImage && !imageError ? (
            <>
              {/* Successful image display */}
              <img
                src={group.image!.url || "/placeholder.svg"}
                alt={group.image!.alt}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                onError={() => setImageError(true)}
                crossOrigin="anonymous"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent opacity-90"></div>

              {/* Image info overlay */}
              <div className="absolute bottom-3 left-3 flex items-center text-xs text-slate-300 bg-black/40 backdrop-blur-md border border-white/[0.1] px-2.5 py-1.5 rounded-lg max-w-[65%] shadow-lg">
                <ImageIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0 text-slate-400" />
                <span className="truncate font-light">{group.image!.alt}</span>
              </div>

              {/* Source link */}
              <div className="absolute bottom-3 right-3">
                <a
                  href={group.image!.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-xs text-slate-200 bg-black/40 backdrop-blur-md border border-white/[0.1] px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLinkIcon className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  <span>Source</span>
                </a>
              </div>

              {/* Experimental badge */}
              <div className="absolute top-3 right-3 flex items-center text-[10px] uppercase tracking-widest font-semibold text-amber-300/90 bg-amber-500/10 backdrop-blur-md border border-amber-500/20 px-2 py-1 rounded-md">
                <AlertTriangle className="h-3 w-3 mr-1.5" />
                <span>Beta</span>
              </div>
            </>
          ) : (
            <>
              {/* Error display */}
              <div className="w-full h-full flex flex-col items-center justify-center p-5 relative">
                <div className="absolute inset-0 bg-rose-500/5 blur-2xl pointer-events-none" />

                <div className="text-center space-y-3 relative z-10 w-full">
                  <div className="bg-rose-500/10 p-3 rounded-full inline-block border border-rose-500/20 mb-1">
                    <AlertCircle className="h-6 w-6 text-rose-400" />
                  </div>
                  <div className="text-sm text-slate-200 font-medium tracking-wide">Image Extraction Failed</div>
                  <div className="text-xs text-slate-500 font-light max-w-full px-4">
                    {group.image?.error_type === "ExtractionFailure" ? (
                      <div className="space-y-1.5">
                        <div>Attempted {group.image.total_attempts} origins:</div>
                        <div className="text-[10px] text-slate-600 truncate">{group.image.attempted_sources?.join(" • ")}</div>
                      </div>
                    ) : (
                      <div className="truncate">{group.image?.error || "Unknown synchronization error"}</div>
                    )}
                  </div>
                </div>

                {/* Error details button */}
                {group.image?.detailed_errors && group.image.detailed_errors.length > 0 && (
                  <div className="absolute bottom-3 left-3 z-20">
                    <div className="group relative">
                      <div className="flex items-center text-xs text-slate-400 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] px-2.5 py-1.5 rounded-lg cursor-help transition-colors">
                        <Info className="h-3.5 w-3.5 mr-1.5" />
                        <span>View Logs</span>
                      </div>

                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 left-0 bg-slate-800/95 backdrop-blur-xl border border-white/[0.1] text-xs text-slate-300 p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 w-72 pointer-events-none translate-y-2 group-hover:translate-y-0">
                        <div className="space-y-3">
                          {group.image.detailed_errors.slice(0, 3).map((error, idx) => (
                            <div key={idx} className="border-b border-white/[0.05] pb-2 last:border-0 last:pb-0">
                              <div className="font-medium text-rose-400/80 mb-0.5">{error.source}</div>
                              <div className="text-slate-400 text-[11px] leading-relaxed line-clamp-2" title={error.error}>{error.error}</div>
                            </div>
                          ))}
                          {group.image.detailed_errors.length > 3 && (
                            <div className="text-slate-500 text-center text-[10px] uppercase tracking-wider font-medium pt-1">
                              +{group.image.detailed_errors.length - 3} additional errors
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {/* =====================================================================
          END OF EXPERIMENTAL FEATURE
          ===================================================================== */}

      {/* Collapsible Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out bg-slate-950/30",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="p-5 space-y-6">
          {Object.entries(headlinesBySource).map(([source, headlines], index) => (
            <div key={source} className={cn("pt-1", index !== 0 && "border-t border-white/[0.05] pt-5")}>
              <h4 className="font-semibold text-xs tracking-widest uppercase text-slate-500 mb-4 flex items-center">
                <Globe className="h-3.5 w-3.5 mr-2 text-blue-400/70" />
                {source}
              </h4>
              <ul className="space-y-1">
                {headlines.map((headline, idx) => (
                  <li key={idx}>
                    <a
                      href={headline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start py-2.5 px-3 -mx-3 rounded-lg hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <div className="flex items-center mr-3 mt-0.5">
                        <div className="bg-white/[0.05] group-hover:bg-blue-500/20 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 transition-colors border border-white/[0.05] group-hover:border-blue-500/30">
                          <Hash className="h-3 w-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-slate-300 font-light group-hover:text-white transition-colors block leading-snug">
                          {headline.title}
                        </span>
                        {headline.time && (
                          <span className="text-[11px] font-medium text-slate-500 flex items-center mt-1.5">
                            <Clock className="h-3 w-3 mr-1.5" />
                            {headline.time}
                          </span>
                        )}
                      </div>

                      <ExternalLink className="h-4 w-4 ml-3 mt-0.5 text-slate-600 opacity-0 group-hover:opacity-100 group-hover:text-blue-400 transition-all flex-shrink-0 -translate-x-2 group-hover:translate-x-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default TopicGroupCard