type ApiResponse = {
  json: (payload: unknown) => void;
};

export default function healthHandler(
  _request: unknown,
  response: ApiResponse,
) {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY",
  );
  const hasOpenRouter = Boolean(
    process.env.OPENROUTER_API_KEY &&
    process.env.OPENROUTER_API_KEY.trim().length > 0,
  );

  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiEngine:
      hasGemini || hasOpenRouter
        ? "AI Matching Engine"
        : "Heuristic Recruiter Engine",
    hasApiKey: hasGemini || hasOpenRouter,
  });
}
