import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  Search,
  Filter,
  FileDown,
  RotateCcw,
  CheckCircle,
  Briefcase,
  SlidersHorizontal,
  Info
} from "lucide-react";
import { Job, MatchResult } from "./types.ts";
import { SAMPLE_RESUMES, SampleResume } from "./data/sampleResumes.ts";
import { ResumeInput } from "./components/ResumeInput.tsx";
import { JobCard } from "./components/JobCard.tsx";
import { AgentStatusBanner } from "./components/AgentStatusBanner.tsx";

export default function App() {
  // Candidate dossier state
  const [selectedPreset, setSelectedPreset] = useState<SampleResume>(SAMPLE_RESUMES[0]);
  const [resumeText, setResumeText] = useState<string>(SAMPLE_RESUMES[0].text);

  // Agent execution state
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [results, setResults] = useState<MatchResult[]>([]);
  const [regeneratingIds, setRegeneratingIds] = useState<Record<string, boolean>>({});

  // Filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "top" | "high_score">("all");
  const [minScoreFilter, setMinScoreFilter] = useState<number>(0);

  // System status
  const [engineInfo, setEngineInfo] = useState<string>("AI Matching Engine");

  useEffect(() => {
    // Check server health & active AI provider
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        if (data?.aiEngine) {
          setEngineInfo(data.aiEngine);
        }
      })
      .catch((err) => console.warn("Health check error:", err));
  }, []);

  const handleSelectPreset = (preset: SampleResume) => {
    setSelectedPreset(preset);
    setResumeText(preset.text);
  };

  const handleRunAgent = async () => {
    if (!resumeText.trim() || resumeText.trim().length < 20) return;

    setStatus("running");
    setErrorMessage("");

    try {
      const response = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          topN: 5,
          minScoreThreshold: 50,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Autonomous agent run failed");
      }

      setResults(data.results || []);
      setStatus("completed");
    } catch (err: any) {
      console.error("Agent error:", err);
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred during evaluation.");
    }
  };

  const handleRegenerateLetter = async (jobId: string) => {
    const targetResult = results.find((r) => r.jobId === jobId);
    if (!targetResult) return;

    setRegeneratingIds((prev) => ({ ...prev, [jobId]: true }));

    try {
      const response = await fetch("/api/agent/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          job: targetResult.job,
        }),
      });

      const data = await response.json();
      if (data.success && data.coverLetter) {
        setResults((prev) =>
          prev.map((item) =>
            item.jobId === jobId
              ? { ...item, coverLetter: data.coverLetter, status: "drafted" }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Failed to regenerate cover letter:", err);
    } finally {
      setRegeneratingIds((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  // Filtered results
  const filteredResults = results.filter((res) => {
    // Score filter
    if (res.score < minScoreFilter) return false;

    // Mode filter
    if (filterMode === "top" && !res.coverLetter) return false;
    if (filterMode === "high_score" && res.score < 80) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = res.job.title.toLowerCase().includes(q);
      const matchCompany = res.job.company.toLowerCase().includes(q);
      const matchSkill = res.job.required_skills.some((s) => s.toLowerCase().includes(q));
      return matchTitle || matchCompany || matchSkill;
    }

    return true;
  });

  const topMatchesCount = results.filter((r) => r.isTopMatch).length;
  const avgScore = results.length
    ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)
    : 0;

  const handleExportDossier = () => {
    const topItems = results.filter((r) => r.coverLetter);
    const content = topItems
      .map(
        (r, i) =>
          `==================================================\n` +
          `CASE #${i + 1}: ${r.job.title} — ${r.job.company}\n` +
          `Fit Score: ${r.score}/100\n` +
          `Recruiter Assessment: ${r.reason}\n` +
          `Location: ${r.job.location} | Type: ${r.job.type}\n` +
          `--------------------------------------------------\n` +
          `TAILORED APPLICATION LETTER:\n\n${r.coverLetter}\n\n`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Job-Hunt-Agent-Dossier.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#EFEDE7] text-[#1C1B19] antialiased selection:bg-[#3454D1]/20">
      {/* Top Brand Header */}
      <header className="border-b border-[#DDD8CE] bg-[#FAF8F5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3454D1]" />
              <h1 className="font-serif-display text-xl sm:text-2xl font-semibold tracking-tight text-[#1C1B19]">
                Job Hunt Agent
              </h1>
            </div>
            <p className="text-xs text-[#8A857C] mt-0.5">
              Autonomous recruiter reasoning, ranking, and application drafting
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-[#4F4C45] px-2.5 py-1 rounded bg-[#EFECE3] border border-[#DDD8CE]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D4F]" />
              16 Live Postings Loaded
            </span>

            {results.length > 0 && (
              <button
                type="button"
                id="btn-export-dossier"
                onClick={handleExportDossier}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-[#EAE6DC] hover:bg-[#E0DBD0] text-[#1C1B19] border border-[#CDC6B5] transition-colors"
              >
                <FileDown className="w-3.5 h-3.5 text-[#8A857C]" />
                Export Dossier
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Section 1: Candidate Dossier Input (The Input is the Hero) */}
        <section id="section-candidate-input" className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif-display text-xl font-medium text-[#1C1B19]">
              Candidate Dossier
            </h2>
            <span className="text-xs text-[#8A857C]">
              Step 1: Provide background & stated experience
            </span>
          </div>

          <ResumeInput
            resumeText={resumeText}
            onChange={setResumeText}
            onSubmit={handleRunAgent}
            isLoading={status === "running"}
            selectedPresetId={selectedPreset?.id}
            onSelectPreset={handleSelectPreset}
          />
        </section>

        {/* Section 2: Agent Status & Pipeline Progress */}
        <section id="section-agent-status">
          <AgentStatusBanner
            status={status}
            totalEvaluated={results.length}
            topMatchesCount={topMatchesCount}
            engineName={engineInfo}
            errorMessage={errorMessage}
          />
        </section>

        {/* Section 3: Evaluated Case Files (Dashboard) */}
        {results.length > 0 && (
          <section id="section-ranked-cases" className="space-y-5">
            {/* Header with Case Stats and Controls */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4 border-t border-[#DDD8CE]">
              <div>
                <div className="flex items-baseline gap-3">
                  <h2 className="font-serif-display text-2xl font-semibold text-[#1C1B19]">
                    Ranked Case Files
                  </h2>
                  <span className="text-xs font-mono text-[#8A857C]">
                    {filteredResults.length} of {results.length} postings
                  </span>
                </div>
                <p className="text-xs text-[#8A857C] mt-1">
                  Ordered by recruiter fit reasoning. Expand any case to view its tailored letter and gap analysis.
                </p>
              </div>

              {/* Summary Stats Row */}
              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-1.5 rounded bg-[#FAF8F5] border border-[#DDD8CE] text-right">
                  <span className="text-[#8A857C] text-[11px] block">Top Fits</span>
                  <span className="font-serif-display text-base font-bold text-[#2F7D4F]">
                    {topMatchesCount}
                  </span>
                </div>
                <div className="px-3 py-1.5 rounded bg-[#FAF8F5] border border-[#DDD8CE] text-right">
                  <span className="text-[#8A857C] text-[11px] block">Avg Fit Score</span>
                  <span className="font-serif-display text-base font-bold text-[#3454D1]">
                    {avgScore}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#FAF8F5] border border-[#DDD8CE]">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-[#8A857C] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by role, company, or tech (e.g. Next.js, Go, AI)..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs text-[#1C1B19] bg-[#EFECE3] border border-[#DDD8CE] rounded focus:outline-none focus:border-[#3454D1] placeholder:text-[#8A857C]"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterMode === "all"
                    ? "bg-[#1C1B19] text-[#EFEDE7]"
                    : "bg-[#EFECE3] text-[#4F4C45] hover:bg-[#E5E1D5]"
                    }`}
                >
                  All ({results.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("top")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterMode === "top"
                    ? "bg-[#1C1B19] text-[#EFEDE7]"
                    : "bg-[#EFECE3] text-[#4F4C45] hover:bg-[#E5E1D5]"
                    }`}
                >
                  With Cover Letter ({topMatchesCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("high_score")}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${filterMode === "high_score"
                    ? "bg-[#1C1B19] text-[#EFEDE7]"
                    : "bg-[#EFECE3] text-[#4F4C45] hover:bg-[#E5E1D5]"
                    }`}
                >
                  High Fit ≥80
                </button>
              </div>
            </div>

            {/* The One Orchestrated Motion Moment: Staggered entry sequence */}
            <div className="space-y-3.5">
              {filteredResults.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-[#DDD8CE] bg-[#F7F5EE] text-xs text-[#8A857C]">
                  No job cases match your current filter parameters. Try clearing your search query.
                </div>
              ) : (
                filteredResults.map((result, index) => (
                  <motion.div
                    key={result.jobId}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: Math.min(index * 0.04, 0.4),
                      ease: "easeOut",
                    }}
                  >
                    <JobCard
                      result={result}
                      rank={index + 1}
                      onRegenerateLetter={handleRegenerateLetter}
                      isRegenerating={Boolean(regeneratingIds[result.jobId])}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#DDD8CE] py-8 text-center text-xs text-[#8A857C]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            Job Hunt Agent &bull; Autonomous Recruiter & Career Writing Intelligence
          </span>
          <span className="font-mono text-[11px] text-[#6F6B62]">
            Chained Decision Architecture &bull; Hackathon Build
          </span>
        </div>
      </footer>
    </div>
  );
}
