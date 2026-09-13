import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";
import {
  SCORING_SYSTEM_PROMPT,
  COVER_LETTER_SYSTEM_PROMPT,
  BATCH_SCORING_SYSTEM_PROMPT,
  BATCH_COVER_LETTER_SYSTEM_PROMPT,
} from "./prompts.ts";
import { Job, MatchScoreEvaluation } from "../types.ts";

let genAiClient: GoogleGenAI | null = null;
let openAiClient: OpenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (genAiClient) return genAiClient;
  const key = process.env.GEMINI_API_KEY;
  if (key && key !== "MY_GEMINI_API_KEY") {
    genAiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "job-hunt-agent",
        },
      },
    });
    return genAiClient;
  }
  return null;
}

function getOpenRouterClient(): OpenAI | null {
  if (openAiClient) return openAiClient;
  const key = process.env.OPENROUTER_API_KEY;
  if (key && key.trim().length > 0) {
    openAiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: key,
      defaultHeaders: {
        "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
        "X-Title": "Job Hunt Agent",
      },
    });
    return openAiClient;
  }
  return null;
}

/**
 * Batch score all jobs against candidate in a SINGLE API call.
 * Avoids per-job rate limit exhaustion (free tier 5 RPM).
 */
export async function batchEvaluateJobs(
  candidateResume: string,
  jobs: Job[],
): Promise<Record<string, MatchScoreEvaluation>> {
  const gemini = getGeminiClient();
  const openRouter = getOpenRouterClient();
  const evaluations: Record<string, MatchScoreEvaluation> = {};

  const jobsPayload = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    required_skills: j.required_skills,
    description: j.description.slice(0, 320),
  }));

  const userPrompt = `
CANDIDATE:
${candidateResume}

JOBS:
${JSON.stringify(jobsPayload, null, 2)}
`;

  // 1. Try Gemini with batch prompt
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: BATCH_SCORING_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || "";
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.id && typeof item.score === "number" && item.reason) {
            evaluations[item.id] = {
              score: Math.min(100, Math.max(0, Math.round(item.score))),
              reason: item.reason,
            };
          }
        }
      }
    } catch (err: any) {
      const status = err?.status || err?.code || "";
      console.info(
        `Gemini batch evaluation notice (${status || "quota/timeout"}), activating smart fallback.`,
      );
    }
  }

  // 2. Try OpenRouter if Gemini returned empty evaluations and OpenRouter key is set
  if (Object.keys(evaluations).length === 0 && openRouter) {
    try {
      const completion = await openRouter.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: BATCH_SCORING_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item?.id && typeof item.score === "number" && item.reason) {
            evaluations[item.id] = {
              score: Math.min(100, Math.max(0, Math.round(item.score))),
              reason: item.reason,
            };
          }
        }
      }
    } catch (err) {
      console.info(
        "OpenRouter batch evaluation notice, activating smart fallback.",
      );
    }
  }

  // 3. Fallback for any missing jobs using recruiter heuristic
  for (const job of jobs) {
    if (!evaluations[job.id]) {
      evaluations[job.id] = heuristicEvaluate(candidateResume, job);
    }
  }

  return evaluations;
}

/**
 * Batch generate cover letters for top qualifying jobs in a SINGLE API call.
 */
export async function batchGenerateCoverLetters(
  candidateResume: string,
  topJobs: Job[],
): Promise<Record<string, string>> {
  if (topJobs.length === 0) return {};

  const gemini = getGeminiClient();
  const openRouter = getOpenRouterClient();
  const letters: Record<string, string> = {};

  const jobsPayload = topJobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    required_skills: j.required_skills,
    description: j.description.slice(0, 350),
  }));

  const userPrompt = `
CANDIDATE:
${candidateResume}

TOP_JOBS:
${JSON.stringify(jobsPayload, null, 2)}
`;

  // 1. Try Gemini in 1 request
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: BATCH_COVER_LETTER_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.4,
        },
      });

      const text = response.text?.trim() || "";
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && typeof parsed === "object") {
        for (const [jobId, letter] of Object.entries(parsed)) {
          if (typeof letter === "string" && letter.length > 40) {
            letters[jobId] = cleanCoverLetter(letter);
          }
        }
      }
    } catch (err: any) {
      const status = err?.status || err?.code || "";
      console.info(
        `Gemini batch cover letter notice (${status || "quota/timeout"}), activating smart fallback.`,
      );
    }
  }

  // 2. Try OpenRouter if needed
  if (Object.keys(letters).length === 0 && openRouter) {
    try {
      const completion = await openRouter.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: BATCH_COVER_LETTER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      if (parsed && typeof parsed === "object") {
        for (const [jobId, letter] of Object.entries(parsed)) {
          if (typeof letter === "string" && letter.length > 40) {
            letters[jobId] = cleanCoverLetter(letter);
          }
        }
      }
    } catch (err) {
      console.info(
        "OpenRouter batch letter notice, activating smart fallback.",
      );
    }
  }

  // 3. Fallback for any missing job letters
  for (const job of topJobs) {
    if (!letters[job.id]) {
      letters[job.id] = generateHeuristicCoverLetter(candidateResume, job);
    }
  }

  return letters;
}

/**
 * Score candidate resume against a single job posting (for single on-demand evaluations)
 */
export async function evaluateJobScore(
  candidateResume: string,
  job: Job,
): Promise<MatchScoreEvaluation> {
  const gemini = getGeminiClient();
  const openRouter = getOpenRouterClient();

  const userPrompt = `
CANDIDATE:
${candidateResume}

JOB:
Title: ${job.title}
Company: ${job.company}
Required Skills: ${job.required_skills.join(", ")}
Description:
${job.description}
`;

  // 1. Try Gemini API
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: SCORING_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || "";
      const cleaned = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.score === "number" && parsed.reason) {
        return {
          score: Math.min(100, Math.max(0, Math.round(parsed.score))),
          reason: parsed.reason,
        };
      }
    } catch (err: any) {
      console.info(
        "Gemini single eval notice, using heuristic fallback:",
        err?.status || err?.message || "",
      );
    }
  }

  // 2. Try OpenRouter if configured
  if (openRouter) {
    try {
      const completion = await openRouter.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: SCORING_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content?.trim() || "";
      const cleaned = raw
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.score === "number" && parsed.reason) {
        return {
          score: Math.min(100, Math.max(0, Math.round(parsed.score))),
          reason: parsed.reason,
        };
      }
    } catch (err) {
      console.info("OpenRouter single eval notice, using heuristic fallback.");
    }
  }

  // 3. Fallback deterministic heuristic scoring
  return heuristicEvaluate(candidateResume, job);
}

/**
 * Generate a personalized, concise cover letter for a single job (for on-demand single regeneration)
 */
export async function generateCoverLetter(
  candidateResume: string,
  job: Job,
): Promise<string> {
  const gemini = getGeminiClient();
  const openRouter = getOpenRouterClient();

  const userPrompt = `
CANDIDATE:
${candidateResume}

JOB:
Title: ${job.title}
Company: ${job.company}
Description:
${job.description}
`;

  // 1. Try Gemini
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: COVER_LETTER_SYSTEM_PROMPT,
          temperature: 0.4,
        },
      });

      const text = response.text?.trim();
      if (text && text.length > 40) {
        return cleanCoverLetter(text);
      }
    } catch (err: any) {
      console.info(
        "Gemini single cover letter notice, using heuristic fallback:",
        err?.status || err?.message || "",
      );
    }
  }

  // 2. Try OpenRouter
  if (openRouter) {
    try {
      const completion = await openRouter.chat.completions.create({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: COVER_LETTER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (text && text.length > 40) {
        return cleanCoverLetter(text);
      }
    } catch (err) {
      console.info("OpenRouter cover letter notice, using heuristic fallback.");
    }
  }

  // 3. Realistic heuristic generation fallback
  return generateHeuristicCoverLetter(candidateResume, job);
}

function cleanCoverLetter(text: string): string {
  return text
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/^(Subject|Dear Hiring Manager|To the Hiring Team)[:,]?\s*/i, "")
    .replace(/^#+ .*\n/gm, "")
    .trim();
}

/**
 * Recruiter-grade heuristic evaluation
 */
export function heuristicEvaluate(
  resume: string,
  job: Job,
): MatchScoreEvaluation {
  const resumeLower = resume.toLowerCase();
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of job.required_skills) {
    const parts = skill.toLowerCase().split(/[\/,\s]+/);
    const hasMatch = parts.some((p) => p.length > 2 && resumeLower.includes(p));
    if (hasMatch) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const matchRatio =
    matchedSkills.length / Math.max(1, job.required_skills.length);
  let baseScore = Math.round(matchRatio * 75);

  // Bonus for domain alignment keywords in description
  const keyTerms =
    job.description
      .toLowerCase()
      .match(
        /\b(react|next\.js|typescript|python|go|docker|kubernetes|sql|postgres|api|cloud|distributed|machine learning|agent)\b/g,
      ) || [];
  let termMatches = 0;
  for (const term of new Set(keyTerms)) {
    if (resumeLower.includes(term)) termMatches++;
  }
  baseScore += Math.min(20, termMatches * 4);

  // Add realistic baseline variance
  const score = Math.min(96, Math.max(28, baseScore));

  let reason = "";
  if (score >= 80) {
    reason = `Strong alignment with ${matchedSkills.slice(0, 2).join(" and ")} experience directly evidenced in candidate background.`;
  } else if (score >= 60) {
    const missing = missingSkills[0] || "specialized domain tools";
    reason = `Solid baseline skills present, but candidate lacks explicit hands-on evidence with ${missing}.`;
  } else {
    const missing =
      missingSkills.slice(0, 2).join(", ") || "core tech requirements";
    reason = `Significant profile gap: role demands deep familiarity with ${missing} which is not reflected in the resume.`;
  }

  return { score, reason };
}

export function generateHeuristicCoverLetter(resume: string, job: Job): string {
  return `At ${job.company}, the ${job.title} role emphasizes ${job.required_skills.slice(0, 2).join(" and ")}, which directly aligns with my hands-on background building modern web software and backend infrastructure. In recent projects, I developed end-to-end applications utilizing TypeScript, structured APIs, and component-driven architectures, ensuring reliable latency and maintainable codebases. Working on ${job.department || "engineering initiatives"} appeals to me because I prioritize high engineering standards, clean documentation, and rapid iteration over superficial complexity. I would appreciate the opportunity to discuss how my practical development skills and technical curiosity can deliver immediate value to the team at ${job.company}.`;
}
