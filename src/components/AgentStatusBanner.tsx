import React from "react";
import { CheckCircle2, Clock, Bot, AlertTriangle, ShieldCheck } from "lucide-react";

interface AgentStatusBannerProps {
  status: "idle" | "running" | "completed" | "error";
  totalEvaluated: number;
  topMatchesCount: number;
  engineName?: string;
  errorMessage?: string;
}

export const AgentStatusBanner: React.FC<AgentStatusBannerProps> = ({
  status,
  totalEvaluated,
  topMatchesCount,
  engineName = "AI Matching Engine",
  errorMessage,
}) => {
  if (status === "idle") {
    return (
      <div className="flex items-center justify-between p-3.5 rounded-lg border border-[#DDD8CE] bg-[#F6F4ED] text-xs text-[#6F6B62]">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#3454D1]" />
          <span>
            <strong className="text-[#1C1B19] font-medium">Autonomous Agent Pipeline:</strong> Ready to evaluate fit across 16 active postings with reasoning-based scoring.
          </span>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#8A857C] font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2F7D4F]" />
          Engine: {engineName}
        </span>
      </div>
    );
  }

  if (status === "running") {
    return (
      <div className="p-4 rounded-lg border border-[#3454D1]/40 bg-[#EEF2FD] text-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-[#3454D1] font-semibold">
            <div className="w-3.5 h-3.5 border-2 border-[#3454D1]/30 border-t-[#3454D1] rounded-full animate-spin" />
            <span>Autonomous Recruiter Agent Active</span>
          </div>
          <span className="text-[11px] font-mono text-[#3454D1]">
            Chaining: Score → Rank → Draft
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-[#3E3C37]">
          <div className="p-2 rounded bg-white/70 border border-[#3454D1]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3454D1] animate-pulse" />
            <span>1. Evaluating requirements & gaps</span>
          </div>
          <div className="p-2 rounded bg-white/70 border border-[#3454D1]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3454D1] animate-pulse" />
            <span>2. Sorting ranked candidate hierarchy</span>
          </div>
          <div className="p-2 rounded bg-white/70 border border-[#3454D1]/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#3454D1] animate-pulse" />
            <span>3. Drafting tailored cover letters</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-2 p-3.5 rounded-lg border border-[#F5D4CA] bg-[#FDF2EF] text-xs text-[#B0492C]">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>Agent error: {errorMessage || "Failed to process candidate dossier. Please verify input."}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 rounded-lg border border-[#CCEAD8] bg-[#EDF7F1] text-xs text-[#2F7D4F]">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2F7D4F]" />
        <span>
          <strong className="font-semibold">Case Evaluation Finished:</strong> Successfully scored {totalEvaluated} postings and drafted tailored cover letters for {topMatchesCount} high-fit positions.
        </span>
      </div>
      <span className="text-[11px] text-[#4F755F] font-mono">
        All cases ranked
      </span>
    </div>
  );
};
