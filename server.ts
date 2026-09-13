import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  evaluateJobScore,
  generateCoverLetter,
  batchEvaluateJobs,
  batchGenerateCoverLetters,
} from "./src/lib/ai.ts";
import { Job, MatchResult } from "./src/types.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Load sample jobs data
const jobsFilePath = path.join(
  process.cwd(),
  "src",
  "data",
  "jobs.sample.json",
);
let sampleJobs: Job[] = [];

try {
  if (fs.existsSync(jobsFilePath)) {
    sampleJobs = JSON.parse(fs.readFileSync(jobsFilePath, "utf-8"));
  }
} catch (e) {
  console.error("Failed to load sample jobs from file:", e);
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Health check & status
app.get("/api/health", (_req, res) => {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
  );
  const hasOpenRouter = Boolean(
    process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY.trim().length > 0,
  );

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiEngine:
      hasGemini || hasOpenRouter
        ? "AI Matching Engine"
        : "Heuristic Recruiter Engine",
    hasApiKey: hasGemini || hasOpenRouter,
  });
});

// List all sample job postings
app.get("/api/jobs", (_req, res) => {
  res.json({
    success: true,
    total: sampleJobs.length,
    jobs: sampleJobs,
  });
});

// Score single job against candidate resume
app.post("/api/agent/score", async (req, res) => {
  try {
    const { resumeText, job } = req.body;
    if (!resumeText || !job) {
      return res
        .status(400)
        .json({ success: false, error: "Missing resumeText or job payload" });
    }

    const evaluation = await evaluateJobScore(resumeText, job);
    return res.json({
      success: true,
      jobId: job.id,
      score: evaluation.score,
      reason: evaluation.reason,
    });
  } catch (error: any) {
    console.error("Error in /api/agent/score:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to evaluate score",
    });
  }
});

// Generate cover letter for a single job
app.post("/api/agent/cover-letter", async (req, res) => {
  try {
    const { resumeText, job } = req.body;
    if (!resumeText || !job) {
      return res
        .status(400)
        .json({ success: false, error: "Missing resumeText or job payload" });
    }

    const coverLetter = await generateCoverLetter(resumeText, job);
    return res.json({
      success: true,
      jobId: job.id,
      coverLetter,
    });
  } catch (error: any) {
    console.error("Error in /api/agent/cover-letter:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate cover letter",
    });
  }
});

// Autonomous Pipeline: score all -> sort -> filter top N -> draft cover letters
app.post("/api/agent/run", async (req, res) => {
  try {
    const {
      resumeText,
      jobs: customJobs,
      topN = 5,
      minScoreThreshold = 50,
    } = req.body;

    if (
      !resumeText ||
      typeof resumeText !== "string" ||
      resumeText.trim().length < 20
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Please provide a valid resume or detailed summary of your skills and background.",
      });
    }

    const jobsToEvaluate: Job[] =
      Array.isArray(customJobs) && customJobs.length > 0
        ? customJobs
        : sampleJobs;

    // Step 1: Score all jobs in a single batched API call (1 call instead of 16)
    const evaluations = await batchEvaluateJobs(resumeText, jobsToEvaluate);

    const scoredResults: { job: Job; score: number; reason: string }[] =
      jobsToEvaluate.map((job) => {
        const evaluation = evaluations[job.id] || {
          score: 50,
          reason: "Evaluated against candidate background.",
        };
        return {
          job,
          score: evaluation.score,
          reason: evaluation.reason,
        };
      });

    // Step 2: Sort descending by score
    scoredResults.sort((a, b) => b.score - a.score);

    // Step 3: Identify Top Matches (top N where score >= minScoreThreshold, or at least top 2)
    const qualifyingIndices = new Set<number>();
    scoredResults.forEach((item, index) => {
      if (index < topN && (item.score >= minScoreThreshold || index < 2)) {
        qualifyingIndices.add(index);
      }
    });

    // Step 4: Batch generate cover letters for top qualifying jobs in a single call (1 call instead of N)
    const topQualifyingJobs = scoredResults
      .filter((_, index) => qualifyingIndices.has(index))
      .map((item) => item.job);

    const draftedLetters = await batchGenerateCoverLetters(
      resumeText,
      topQualifyingJobs,
    );

    const finalResults: MatchResult[] = scoredResults.map((item, index) => {
      const isTop = qualifyingIndices.has(index);
      const coverLetter = isTop ? draftedLetters[item.job.id] : undefined;

      return {
        jobId: item.job.id,
        job: item.job,
        score: item.score,
        reason: item.reason,
        coverLetter,
        isTopMatch: isTop,
        status: isTop ? "drafted" : "scored",
      };
    });

    return res.json({
      success: true,
      totalEvaluated: finalResults.length,
      topMatchesCount: qualifyingIndices.size,
      results: finalResults,
    });
  } catch (error: any) {
    console.error("Error in /api/agent/run:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to execute agent pipeline",
    });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
export async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Job Hunt Agent Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
