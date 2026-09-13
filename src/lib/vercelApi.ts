import fs from "fs";
import path from "path";
import {
  batchEvaluateJobs,
  batchGenerateCoverLetters,
  evaluateJobScore,
  generateCoverLetter,
} from "./ai.ts";
import { Job, MatchResult } from "../types.ts";

type ApiRequest = {
  body?: any;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
};

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
} catch (error) {
  console.error("Failed to load sample jobs from file:", error);
}

export function healthHandler(_req: ApiRequest, res: ApiResponse) {
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
}

export function jobsHandler(_req: ApiRequest, res: ApiResponse) {
  res.json({
    success: true,
    total: sampleJobs.length,
    jobs: sampleJobs,
  });
}

export async function scoreHandler(req: ApiRequest, res: ApiResponse) {
  try {
    const { resumeText, job } = req.body || {};
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
}

export async function coverLetterHandler(req: ApiRequest, res: ApiResponse) {
  try {
    const { resumeText, job } = req.body || {};
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
}

export async function runHandler(req: ApiRequest, res: ApiResponse) {
  try {
    const {
      resumeText,
      jobs: customJobs,
      topN = 5,
      minScoreThreshold = 50,
    } = req.body || {};

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
    const evaluations = await batchEvaluateJobs(resumeText, jobsToEvaluate);

    const scoredResults: { job: Job; score: number; reason: string }[] =
      jobsToEvaluate.map((job) => {
        const evaluation = evaluations[job.id] || {
          score: 50,
          reason: "Evaluated against candidate background.",
        };
        return { job, score: evaluation.score, reason: evaluation.reason };
      });

    scoredResults.sort((a, b) => b.score - a.score);

    const qualifyingIndices = new Set<number>();
    scoredResults.forEach((item, index) => {
      if (index < topN && (item.score >= minScoreThreshold || index < 2)) {
        qualifyingIndices.add(index);
      }
    });

    const topQualifyingJobs = scoredResults
      .filter((_, index) => qualifyingIndices.has(index))
      .map((item) => item.job);
    const draftedLetters = await batchGenerateCoverLetters(
      resumeText,
      topQualifyingJobs,
    );

    const finalResults: MatchResult[] = scoredResults.map((item, index) => {
      const isTop = qualifyingIndices.has(index);
      return {
        jobId: item.job.id,
        job: item.job,
        score: item.score,
        reason: item.reason,
        coverLetter: isTop ? draftedLetters[item.job.id] : undefined,
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
}