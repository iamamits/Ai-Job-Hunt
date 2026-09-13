import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Copy,
  Check,
  Building2,
  MapPin,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
  Clock,
  Briefcase
} from "lucide-react";
import { MatchResult } from "../types.ts";
import { MatchScoreBadge } from "./MatchScoreBadge.tsx";

interface JobCardProps {
  result: MatchResult;
  rank: number;
  onRegenerateLetter?: (jobId: string) => Promise<void>;
  isRegenerating?: boolean;
}

export const JobCard: React.FC<JobCardProps> = ({
  result,
  rank,
  onRegenerateLetter,
  isRegenerating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { job, score, reason, coverLetter, isTopMatch } = result;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!coverLetter) return;
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const wordCount = coverLetter ? coverLetter.trim().split(/\s+/).length : 0;

  return (
    <div
      id={`job-case-${job.id}`}
      className={`rounded-lg border transition-colors duration-150 ${
        isTopMatch
          ? "bg-[#FCFBF8] border-[#CDC6B5] shadow-xs"
          : "bg-[#F9F8F5] border-[#DDD8CE]"
      }`}
    >
      {/* Header Row / Main Summary */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-5 sm:p-6 cursor-pointer select-none"
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left: Rank, Title, Meta, Reason */}
          <div className="flex items-start gap-3.5 flex-1 min-w-0">
            {/* Case file rank index */}
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-[#ECE7DC] border border-[#DDD8CE] text-xs font-serif-display font-bold text-[#1C1B19]">
              #{rank}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                <h3 className="text-lg font-semibold text-[#1C1B19] tracking-tight hover:text-[#3454D1] transition-colors">
                  {job.title}
                </h3>
                {isTopMatch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F1] text-[#2F7D4F] border border-[#CCEAD8]">
                    <Sparkles className="w-3 h-3" />
                    Top Fit Candidate
                  </span>
                )}
              </div>

              {/* Company & Meta Details */}
              <div className="flex items-center flex-wrap gap-y-1 gap-x-4 mt-1.5 text-xs text-[#8A857C]">
                <span className="inline-flex items-center gap-1 font-medium text-[#1C1B19]">
                  <Building2 className="w-3.5 h-3.5 text-[#8A857C]" />
                  {job.company}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {job.type}
                </span>
                {job.salaryRange && (
                  <span className="font-mono text-[11px] text-[#4F4C45]">
                    {job.salaryRange}
                  </span>
                )}
              </div>

              {/* Recruiter Evaluation Reason */}
              <div className="mt-3 text-sm text-[#3E3C37] leading-relaxed flex items-start gap-2 bg-[#F3F0E8] p-2.5 rounded border border-[#E4DFD3]">
                <AlertCircle className="w-4 h-4 text-[#8A857C] shrink-0 mt-0.5" />
                <p className="flex-1">
                  <span className="font-semibold text-[#1C1B19]">Recruiter Assessment:</span>{" "}
                  {reason}
                </p>
              </div>

              {/* Required Skills tags */}
              <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-[#8A857C] mr-1">Requirements:</span>
                {job.required_skills.slice(0, 5).map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] bg-[#EFECE3] text-[#4F4C45] border border-[#DDD8CE]"
                  >
                    {skill}
                  </span>
                ))}
                {job.required_skills.length > 5 && (
                  <span className="text-[11px] text-[#8A857C]">
                    +{job.required_skills.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Large Match Score + Chevron */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#DDD8CE]">
            <MatchScoreBadge score={score} size="lg" />

            <div className="flex items-center gap-1 text-xs text-[#8A857C] hover:text-[#1C1B19] mt-2 transition-colors">
              <span>{isExpanded ? "Hide dossier" : coverLetter ? "Review cover letter" : "View case details"}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inline Expanded Case File Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-[#DDD8CE] bg-[#F4F2EC]"
          >
            <div className="p-5 sm:p-6 space-y-5">
              {/* Cover Letter Section */}
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3454D1]" />
                    <h4 className="text-sm font-semibold text-[#1C1B19] uppercase tracking-wider text-[11px]">
                      Tailored Application Letter
                    </h4>
                    {coverLetter && (
                      <span className="text-xs text-[#8A857C] font-mono">
                        ({wordCount} words)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {coverLetter && (
                      <button
                        type="button"
                        onClick={handleCopy}
                        id={`btn-copy-${job.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#EFEDE7] hover:bg-[#E5E2D9] text-[#1C1B19] border border-[#CDC6B5] transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#2F7D4F]" />
                            <span className="text-[#2F7D4F]">Copied to Clipboard</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#8A857C]" />
                            <span>Copy Letter</span>
                          </>
                        )}
                      </button>
                    )}

                    {onRegenerateLetter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerateLetter(job.id);
                        }}
                        disabled={isRegenerating}
                        id={`btn-regen-${job.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#EFEDE7] hover:bg-[#E5E2D9] text-[#1C1B19] border border-[#CDC6B5] transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 text-[#8A857C] ${
                            isRegenerating ? "animate-spin" : ""
                          }`}
                        />
                        <span>{isRegenerating ? "Drafting..." : "Regenerate"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {coverLetter ? (
                  <div className="p-4 rounded-md bg-[#FAF9F6] border border-[#DDD8CE] text-sm text-[#1C1B19] leading-relaxed whitespace-pre-line font-sans shadow-2xs">
                    {coverLetter}
                  </div>
                ) : (
                  <div className="p-4 rounded-md bg-[#EFECE3] border border-[#DDD8CE] text-xs text-[#8A857C] flex items-center justify-between">
                    <span>
                      Cover letter drafting is prioritized for top-tier candidates (fit score ≥ 50).
                    </span>
                    {onRegenerateLetter && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerateLetter(job.id);
                        }}
                        className="text-xs font-semibold text-[#3454D1] hover:underline"
                      >
                        Draft on-demand
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Job Posting Full Description */}
              <div className="pt-2 border-t border-[#DDD8CE]">
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-xs font-medium text-[#8A857C] hover:text-[#1C1B19] flex items-center gap-1 transition-colors"
                >
                  <span>{showFullDesc ? "Hide role description" : "Read full job specification"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      showFullDesc ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showFullDesc && (
                  <div className="mt-3 p-4 rounded bg-[#FAF9F6] border border-[#DDD8CE] text-xs text-[#4F4C45] leading-relaxed">
                    <p className="whitespace-pre-line">{job.description}</p>
                    <div className="mt-3 pt-3 border-t border-[#EAE6DD]">
                      <div className="font-medium text-[#1C1B19] mb-1.5">
                        All Required Skills:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {job.required_skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded text-[11px] bg-[#EAE6DD] text-[#3E3C37]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
