import type React from "react";
import { Loader2, CheckCircle, AlertCircle, Clock, Server } from "lucide-react";

interface JobStatusProps {
  status: "idle" | "loading" | "success" | "error";
  message: string;
  processedCount?: number;
  totalCount?: number;
}

const JobStatus: React.FC<JobStatusProps> = ({ status, message, processedCount, totalCount }) => {
  // Calculate progress percentage
  const progressPercentage = processedCount && totalCount ? Math.round((processedCount / totalCount) * 100) : 0;

  // Check if this is a date processing message
  const isDateProcessing = message.includes("Processing date") || message.includes("date");

  if (status === "idle") return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-slate-950/40 p-6 border border-white/[0.05] shadow-lg backdrop-blur-md">
      {/* Contextual ambient background glow */}
      <div
        className={`absolute top-0 right-0 w-40 h-40 -mt-16 -mr-16 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${status === 'success' ? 'bg-emerald-500' :
            status === 'error' ? 'bg-rose-500' :
              'bg-blue-500'
          }`}
      />

      <div className="flex items-center mb-5 relative z-10">
        {status === "loading" && (
          <div className="bg-blue-500/10 p-2.5 rounded-lg mr-4 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
          </div>
        )}
        {status === "success" && (
          <div className="bg-emerald-500/10 p-2.5 rounded-lg mr-4 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <CheckCircle className="h-5 w-5 text-emerald-400" />
          </div>
        )}
        {status === "error" && (
          <div className="bg-rose-500/10 p-2.5 rounded-lg mr-4 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
            <AlertCircle className="h-5 w-5 text-rose-400" />
          </div>
        )}

        <span className="font-medium text-slate-200 tracking-wide text-lg">
          {status === "loading" && (
            <>
              System Processing
              {!isDateProcessing && processedCount !== undefined && totalCount !== undefined && (
                <span className="text-slate-500 text-sm ml-2 font-light">
                  ({processedCount} / {totalCount} records)
                </span>
              )}
            </>
          )}
          {status === "success" && "Analysis Complete"}
          {status === "error" && "System Error"}
        </span>
      </div>

      {status === "loading" && !isDateProcessing && processedCount !== undefined && totalCount !== undefined && (
        <div className="space-y-3 my-6 relative z-10">
          <div className="w-full bg-slate-900/80 rounded-full h-1.5 overflow-hidden border border-white/[0.02]">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-medium tracking-widest uppercase">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-blue-400/70" />
              <span>Computing Metrics</span>
            </div>
            <div className="text-blue-400">{progressPercentage}%</div>
          </div>
        </div>
      )}

      <div className="flex items-start pt-4 mt-2 border-t border-white/[0.05] relative z-10">
        <div className="bg-white/[0.03] p-1.5 rounded-md mr-3 mt-0.5">
          <Server className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
        </div>
        <p className="text-sm text-slate-300 font-light leading-relaxed mt-1">
          {message}
        </p>
      </div>
    </div>
  );
};

export default JobStatus;