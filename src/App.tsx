"use client";

import { useState } from "react";
import { BarChart2, TrendingUp, Globe, Settings, Activity, FileText } from "lucide-react";
import TopicSelector from "./components/TopicSelector";
import JobStatus from "./components/JobStatus";
import ResultsView from "./components/ResultsView";
import { useAnalysis } from "./hooks/useAnalysis";
import type { AnalysisResult } from "./types/analysis";

function App() {
	const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
	const [timeRange, setTimeRange] = useState<"today" | "last-week">("today");
	const { startAnalysis, status, result, message, loadFromFile, saveToFile, processedCount, totalCount } = useAnalysis();

	const handleStartAnalysis = () => {
		startAnalysis(selectedTopic, timeRange === "last-week");
	};

	return (
		<div className="min-h-screen bg-slate-950 text-slate-300 relative overflow-hidden font-sans selection:bg-blue-500/30">
			{/* Ambient Glassmorphic Background Glows */}
			<div className="fixed inset-0 z-0 pointer-events-none">
				<div className="absolute top-[-10%] left-[-5%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px]" />
				<div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-indigo-900/10 blur-[120px]" />
			</div>

			{/* Header */}
			<header className="sticky top-0 z-50 bg-slate-950/50 backdrop-blur-xl border-b border-white/[0.05] shadow-sm">
				<div className="container mx-auto px-6 py-4 flex items-center justify-between relative">
					<div className="flex items-center space-x-3">
						<div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-2 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center">
							<Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
						</div>
						<h1 className="text-xl font-medium tracking-wide text-slate-100">
							Brutalist <span className="text-slate-400 font-light">Analyzer</span>
						</h1>
					</div>
					<div className="text-xs font-medium tracking-widest uppercase text-slate-500 flex items-center gap-2">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
							<span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
						</span>
						System Active
					</div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-10 flex flex-col gap-8 relative z-10 max-w-7xl">
				{/* Controls Section */}
				<section className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/[0.05] transition-all duration-300 hover:bg-slate-900/50">
					<div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
						<div className="flex items-center gap-3">
							<div className="p-2 bg-blue-500/10 rounded-md text-blue-400">
								<Settings size={18} />
							</div>
							<h2 className="text-lg font-medium text-slate-200 tracking-wide">Analysis Configuration</h2>
						</div>
						<span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
							Step 01
						</span>
					</div>

					<div className="pt-2">
						<TopicSelector
							selectedTopic={selectedTopic}
							onSelectTopic={setSelectedTopic}
							timeRange={timeRange}
							onSelectTimeRange={setTimeRange}
							onStartAnalysis={handleStartAnalysis}
							isLoading={status === "loading"}
							loadFromFile={loadFromFile}
						/>
					</div>
				</section>

				{/* Status Section */}
				{(status !== "idle" || result) && (
					<section className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/[0.05] transition-all duration-300 hover:bg-slate-900/50">
						<div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-indigo-500/10 rounded-md text-indigo-400">
									<TrendingUp size={18} />
								</div>
								<h2 className="text-lg font-medium text-slate-200 tracking-wide">Processing Status</h2>
							</div>
							<span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
								Step 02
							</span>
						</div>

						<div className="pt-2">
							<JobStatus
								status={status}
								message={message}
								processedCount={processedCount}
								totalCount={totalCount}
							/>
						</div>
					</section>
				)}

				{/* Results Section */}
				{result && (
					<section className="bg-slate-900/40 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/[0.05] transition-all duration-300 hover:bg-slate-900/50">
						<div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-emerald-500/10 rounded-md text-emerald-400">
									<FileText size={18} />
								</div>
								<h2 className="text-lg font-medium text-slate-200 tracking-wide">Analysis Results</h2>
							</div>
							<span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05]">
								Step 03
							</span>
						</div>

						<div className="pt-2">
							<ResultsView
								result={result as AnalysisResult}
								onSaveResults={saveToFile}
								onLoadResults={loadFromFile}
							/>
						</div>
					</section>
				)}
			</main>

			{/* Footer */}
			<footer className="relative z-10 border-t border-white/[0.05] bg-slate-950/50 backdrop-blur-lg mt-12 py-6 text-center">
				<div className="container mx-auto px-6">
					<p className="text-xs tracking-wider text-slate-500 uppercase">
						© {new Date().getFullYear()} Brutalist Report Analyzer <span className="mx-2 opacity-50">|</span> Enterprise Intelligence
					</p>
				</div>
			</footer>
		</div>
	);
}

export default App;