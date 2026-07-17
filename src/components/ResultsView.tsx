"use client"

import type React from "react"
import { useState } from "react"
import { Save, HelpCircle, Layers, BarChart3, Info } from "lucide-react"
import Button from "./ui/Button"
import Modal from "./ui/Modal"
import TopicGroupCard from "./TopicGroupCard"
import WordCloud from "./WordCloud"
import { useAnalysis } from "../hooks/useAnalysis"
import type { AnalysisResult } from "../types/analysis"

interface ResultsViewProps {
  result: AnalysisResult
  onSaveResults: () => void
  onLoadResults: () => void
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, onSaveResults, onLoadResults }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set())
  const [showWordCloud, setShowWordCloud] = useState(false)
  const { showSaveModal, saveModalMessage, setShowSaveModal } = useAnalysis()

  const toggleGroup = (index: number) => {
    const newSet = new Set(expandedGroups)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setExpandedGroups(newSet)
  }

  return (
    <div className="space-y-8">
      {/* Summary Section */}
      <div className="relative overflow-hidden rounded-xl bg-slate-950/40 p-6 border border-white/[0.05] shadow-lg backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between">
        {/* Ambient Glow */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mt-24 -ml-24" />

        <div className="space-y-3 mb-6 md:mb-0 relative z-10">
          <div className="flex items-center">
            <div className="bg-blue-500/10 p-2 rounded-lg mr-3 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              <Layers className="h-4 w-4 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-200 tracking-wide">Analysis Summary</h3>
          </div>

          <div className="pl-12 space-y-1">
            <p className="text-slate-300 font-light text-sm">
              Identified <strong className="text-white font-medium">{result.total_groups}</strong> topic groups spanning <strong className="text-white font-medium">{result.total_headlines}</strong> headlines.
            </p>
            <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-slate-500 uppercase mt-2">
              <span className="bg-white/[0.03] px-2 py-1 rounded border border-white/[0.05]">
                {result.topic ? result.topic : "All Topics"}
              </span>
              <span>•</span>
              <span className="bg-white/[0.03] px-2 py-1 rounded border border-white/[0.05]">
                {result.is_last_week ? "Last 7 Days" : "Today"}
              </span>
              <span>•</span>
              <span className="bg-white/[0.03] px-2 py-1 rounded border border-white/[0.05]">
                {result.date}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <div className="group relative">
            <Button onClick={() => setShowWordCloud(!showWordCloud)} variant="outline" size="sm" className="bg-slate-900/50 hover:bg-slate-800 border-white/[0.1] text-slate-300 transition-all duration-300">
              <BarChart3 className={`h-4 w-4 mr-2 ${showWordCloud ? 'text-blue-400' : 'text-slate-400'}`} />
              {showWordCloud ? "Hide Chart" : "Show Chart"}
            </Button>
            <div className="absolute bottom-full mb-3 right-0 bg-slate-800/90 backdrop-blur-md border border-white/[0.1] text-xs text-slate-200 p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 w-48 pointer-events-none translate-y-2 group-hover:translate-y-0">
              Toggle word frequency visualization dashboard
            </div>
          </div>
          <div className="group relative">
            <Button onClick={onSaveResults} variant="outline" size="sm" className="bg-slate-900/50 hover:bg-slate-800 border-white/[0.1] text-slate-300 transition-all duration-300">
              <Save className="h-4 w-4 mr-2 text-emerald-400" />
              Export JSON
            </Button>
            <div className="absolute bottom-full mb-3 right-0 bg-slate-800/90 backdrop-blur-md border border-white/[0.1] text-xs text-slate-200 p-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 w-48 pointer-events-none translate-y-2 group-hover:translate-y-0">
              Export raw analysis data to a local JSON file
            </div>
          </div>
        </div>
      </div>

      {/* Word Cloud Section */}
      {showWordCloud && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <WordCloud result={result} />
        </div>
      )}

      {/* Helper Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/5 border border-blue-500/10 rounded-lg backdrop-blur-sm">
        <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <p className="text-sm font-light text-blue-200/80">
          Click on any topic card below to expand its contents and view all related data points.
        </p>
      </div>

      {/* Topic Groups - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {result.common_topics.map((group, index) => (
          <TopicGroupCard
            key={index}
            group={group}
            isExpanded={expandedGroups.has(index)}
            onToggle={() => toggleGroup(index)}
          />
        ))}
      </div>

      {/* Save Success Modal */}
      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)} title="Export Status">
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-white/[0.05]">
            <p className="text-slate-300 font-light leading-relaxed whitespace-pre-line text-sm">
              {saveModalMessage}
            </p>
          </div>
          <Button onClick={() => setShowSaveModal(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white border-0">
            Acknowledge
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default ResultsView