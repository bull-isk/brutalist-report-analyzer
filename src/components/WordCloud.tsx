"use client";

import type React from "react";
import { useMemo } from "react";
import { Hash, Activity } from "lucide-react";
import type { AnalysisResult } from "../types/analysis";

interface WordCloudProps {
	result: AnalysisResult;
}

const WordCloud: React.FC<WordCloudProps> = ({ result }) => {
	const wordFrequency = useMemo(() => {
		const words: Record<string, number> = {};
		const stopWords = new Set([
			"the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
			"of", "with", "by", "is", "are", "was", "were", "be", "been", "have",
			"has", "had", "do", "does", "did", "will", "would", "could", "should",
			"may", "might", "can", "must", "shall", "this", "that", "these", "those",
			"i", "you", "he", "she", "it", "we", "they", "me", "him", "her", "us",
			"them", "my", "your", "his", "her", "its", "our", "their", "from", "up",
			"about", "into", "over", "after", "as", "how", "what", "when", "where",
			"who", "why", "which", "than", "so", "very", "just", "now", "then",
			"here", "there", "more", "most", "much", "many", "some", "any", "all",
			"no", "not", "only", "other", "new", "old", "first", "last", "long",
			"great", "little", "own", "right", "big", "high", "different", "small",
			"large", "next", "early", "young", "important", "few", "public", "bad",
			"same", "able"
		]);

		// Extract words from all headlines
		result.common_topics.forEach((topic) => {
			topic.headlines.forEach((headline) => {
				const words_in_title = headline.title
					.toLowerCase()
					.replace(/[^\w\s]/g, " ")
					.split(/\s+/)
					.filter((word) => word.length > 3 && !stopWords.has(word));

				words_in_title.forEach((word) => {
					words[word] = (words[word] || 0) + 1;
				});
			});
		});

		// Sort by frequency and take top 50
		return Object.entries(words)
			.sort(([, a], [, b]) => b - a)
			.slice(0, 50)
			.map(([word, count]) => ({ word, count }));
	}, [result]);

	const maxCount = Math.max(...wordFrequency.map((w) => w.count));

	if (wordFrequency.length === 0) return null;

	return (
		<div className="relative overflow-hidden rounded-xl bg-slate-950/40 p-6 border border-white/[0.05] shadow-lg backdrop-blur-md">
			{/* Ambient Background Glow */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none z-0" />

			<div className="relative z-10">
				<div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.05]">
					<div className="flex items-center gap-3">
						<div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
							<Activity className="h-4 w-4 text-blue-400" />
						</div>
						<h3 className="text-lg font-medium text-slate-200 tracking-wide">Wordcloud</h3>
					</div>
					<div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-1.5">
						<Hash className="h-3 w-3" />
						Top {wordFrequency.length} Entities
					</div>
				</div>

				<div className="flex flex-wrap gap-x-4 gap-y-3 justify-center items-center py-4 px-2">
					{wordFrequency.map(({ word, count }) => {
						const normalizedWeight = count / maxCount;
						// Map size between 14px and 36px
						const size = Math.max(14, Math.min(36, normalizedWeight * 24 + 12));

						// Determine visual hierarchy based on frequency
						let colorClass = "text-slate-500";
						if (normalizedWeight > 0.7) colorClass = "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]";
						else if (normalizedWeight > 0.4) colorClass = "text-indigo-300";
						else if (normalizedWeight > 0.2) colorClass = "text-slate-300";

						return (
							<span
								key={word}
								className={`${colorClass} hover:text-white transition-all duration-300 cursor-crosshair select-none hover:scale-110 inline-block`}
								style={{
									fontSize: `${size}px`,
									fontWeight: normalizedWeight > 0.7 ? 600 : normalizedWeight > 0.4 ? 500 : 300,
									opacity: Math.max(0.6, normalizedWeight + 0.3),
								}}
								title={`Entity: ${word.toUpperCase()}\nFrequency: ${count} occurrences`}
							>
								{word}
							</span>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default WordCloud;