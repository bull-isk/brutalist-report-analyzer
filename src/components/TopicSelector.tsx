"use client";

import type React from "react";
import {
	Search, Info, Filter, Calendar, FolderOpen,
	Cpu, Newspaper, Briefcase, Microscope,
	Gamepad2, Palette, Landmark, Trophy, LayoutGrid,
	CalendarDays, CalendarClock
} from "lucide-react";
import Button from "./ui/Button";
import { TOPICS } from "../constants";

interface TopicSelectorProps {
	selectedTopic: string | null;
	onSelectTopic: (topic: string | null) => void;
	timeRange: "today" | "last-week";
	onSelectTimeRange: (range: "today" | "last-week") => void;
	onStartAnalysis: () => void;
	isLoading: boolean;
	loadFromFile: () => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
	selectedTopic, onSelectTopic, timeRange, onSelectTimeRange, onStartAnalysis, isLoading, loadFromFile
}) => {
	// Enterprise-grade icon mapping replacing emojis
	const topicIcons: Record<string, React.ElementType> = {
		tech: Cpu,
		news: Newspaper,
		business: Briefcase,
		science: Microscope,
		gaming: Gamepad2,
		culture: Palette,
		politics: Landmark,
		sports: Trophy,
	};

	return (
		<div className="flex flex-col gap-8">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
				{/* Topic Selection Panel */}
				<div className="bg-slate-950/40 rounded-xl p-5 border border-white/[0.05] shadow-inner backdrop-blur-sm">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-blue-400" />
							<label className="text-xs font-semibold tracking-widest uppercase text-slate-300">Data Stream</label>
						</div>
						<div className="group relative">
							<Info className="h-4 w-4 text-slate-500 hover:text-blue-400 transition-colors cursor-help" />
							<div className="absolute right-0 bottom-full mb-2 bg-slate-800/95 backdrop-blur-xl border border-white/[0.1] text-xs text-slate-300 p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 w-56 pointer-events-none translate-y-2 group-hover:translate-y-0 z-20">
								Filter intelligence by a specific domain or analyze the global feed.
							</div>
						</div>
					</div>

					<div className="flex flex-wrap gap-2">
						<button
							onClick={() => onSelectTopic(null)}
							className={`px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-all duration-300 ${selectedTopic === null
									? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500"
									: "bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:bg-white/[0.08] hover:text-slate-200"
								}`}
						>
							<LayoutGrid className="w-4 h-4 mr-2 opacity-80" />
							All Topics
						</button>

						{TOPICS.map((topic) => {
							const Icon = topicIcons[topic] || LayoutGrid;
							return (
								<button
									key={topic}
									onClick={() => onSelectTopic(topic)}
									className={`px-3 py-2 rounded-lg flex items-center text-sm font-medium transition-all duration-300 ${selectedTopic === topic
											? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] border border-blue-500"
											: "bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:bg-white/[0.08] hover:text-slate-200"
										}`}
								>
									<Icon className="w-4 h-4 mr-2 opacity-80" />
									{topic.charAt(0).toUpperCase() + topic.slice(1)}
								</button>
							);
						})}
					</div>
				</div>

				{/* Time Range Selection Panel */}
				<div className="bg-slate-950/40 rounded-xl p-5 border border-white/[0.05] shadow-inner backdrop-blur-sm">
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-indigo-400" />
							<label className="text-xs font-semibold tracking-widest uppercase text-slate-300">Temporal Scope</label>
						</div>
						<div className="group relative">
							<Info className="h-4 w-4 text-slate-500 hover:text-indigo-400 transition-colors cursor-help" />
							<div className="absolute right-0 bottom-full mb-2 bg-slate-800/95 backdrop-blur-xl border border-white/[0.1] text-xs text-slate-300 p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 w-56 pointer-events-none translate-y-2 group-hover:translate-y-0 z-20">
								Define the lookback window for news aggregation and analysis.
							</div>
						</div>
					</div>

					<div className="flex gap-3 h-[88px]">
						<button
							onClick={() => onSelectTimeRange("today")}
							className={`flex-1 rounded-lg flex flex-col items-center justify-center transition-all duration-300 border ${timeRange === "today"
									? "bg-indigo-600/20 border-indigo-500/50 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
									: "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
								}`}
						>
							<CalendarDays className={`w-6 h-6 mb-2 ${timeRange === "today" ? "text-indigo-400" : "text-slate-500"}`} />
							<span className="text-sm font-medium tracking-wide">Last 24 Hours</span>
						</button>

						<button
							onClick={() => onSelectTimeRange("last-week")}
							className={`flex-1 rounded-lg flex flex-col items-center justify-center transition-all duration-300 border ${timeRange === "last-week"
									? "bg-indigo-600/20 border-indigo-500/50 text-indigo-100 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
									: "bg-white/[0.02] border-white/[0.05] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
								}`}
						>
							<CalendarClock className={`w-6 h-6 mb-2 ${timeRange === "last-week" ? "text-indigo-400" : "text-slate-500"}`} />
							<span className="text-sm font-medium tracking-wide">Past 7 Days</span>
						</button>
					</div>
				</div>
			</div>

			{/* Action Bar */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t border-white/[0.05] gap-4">
				<div className="flex items-center gap-2 text-sm text-slate-400 font-light">
					<div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
					Target: <strong className="text-slate-200 font-medium ml-1">
						{selectedTopic ? selectedTopic.charAt(0).toUpperCase() + selectedTopic.slice(1) : "Global Feed"}
					</strong>
					<span className="mx-1 opacity-50">|</span>
					Scope: <strong className="text-slate-200 font-medium ml-1">
						{timeRange === "today" ? "24h Window" : "7-Day Window"}
					</strong>
				</div>

				<div className="flex flex-col sm:flex-row items-center gap-4">
					<div className="group relative w-full sm:w-auto">
						<Button
							onClick={loadFromFile}
							disabled={isLoading}
							variant="outline"
							className="w-full sm:w-auto bg-slate-900/50 hover:bg-slate-800 border-white/[0.1] text-slate-300 transition-all duration-300 h-11"
						>
							<FolderOpen className="h-4 w-4 mr-2" />
							Load Local JSON
						</Button>
						<div className="absolute bottom-full mb-3 right-0 bg-slate-800/95 backdrop-blur-xl border border-white/[0.1] text-xs text-slate-300 p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 w-48 pointer-events-none translate-y-2 group-hover:translate-y-0 z-20 hidden sm:block">
							Import previously generated analysis matrices.
						</div>
					</div>

					<div className="w-px h-8 bg-white/[0.1] hidden sm:block" />

					<Button
						onClick={onStartAnalysis}
						disabled={isLoading}
						className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all duration-300 h-11 px-6"
					>
						<Search className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
						{isLoading ? "Analyzing..." : "Start analysis"}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default TopicSelector;