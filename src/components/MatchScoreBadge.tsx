import React from "react";

interface MatchScoreBadgeProps {
  score: number;
  size?: "lg" | "md" | "sm";
  showLabel?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score,
  size = "lg",
  showLabel = true,
}) => {
  let textColor = "#3454D1"; // default signal blue
  let tagBg = "#EBF0FF";
  let tagBorder = "#D1DCFE";
  let tierLabel = "Moderate Fit";

  if (score >= 80) {
    textColor = "#2F7D4F"; // high-match green
    tagBg = "#EDF7F1";
    tagBorder = "#CCEAD8";
    tierLabel = "Strong Match";
  } else if (score < 50) {
    textColor = "#B0492C"; // low-match muted rust
    tagBg = "#FDF2EF";
    tagBorder = "#F5D4CA";
    tierLabel = "Low Fit";
  } else {
    textColor = "#C07D2B"; // mid-match amber
    tagBg = "#FEF7ED";
    tagBorder = "#FCE7C7";
    tierLabel = "Potential Fit";
  }

  if (size === "sm") {
    return (
      <span
        className="inline-flex items-baseline gap-1 px-2.5 py-0.5 rounded text-xs font-semibold tracking-tight"
        style={{ color: textColor, backgroundColor: tagBg, border: `1px solid ${tagBorder}` }}
      >
        <span className="font-serif-display text-sm font-bold">{score}</span>
        <span className="text-[10px] opacity-70">/100</span>
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end text-right">
      <div className="flex items-baseline gap-0.5 leading-none">
        <span
          className="font-serif-display font-semibold tracking-tight leading-none"
          style={{
            fontSize: size === "lg" ? "2.5rem" : "1.75rem",
            color: textColor,
          }}
        >
          {score}
        </span>
        <span
          className="text-xs font-normal"
          style={{ color: "#8A857C" }}
        >
          /100
        </span>
      </div>
      {showLabel && (
        <span
          className="mt-1 px-2 py-0.5 rounded text-[11px] font-medium tracking-normal"
          style={{
            color: textColor,
            backgroundColor: tagBg,
            border: `1px solid ${tagBorder}`,
          }}
        >
          {tierLabel}
        </span>
      )}
    </div>
  );
};
