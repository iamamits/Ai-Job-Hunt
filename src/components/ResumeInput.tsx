import React, { useState, useRef } from "react";
import { Upload, FileText, Sparkles, X, UserCheck } from "lucide-react";
import { SAMPLE_RESUMES, SampleResume } from "../data/sampleResumes.ts";

interface ResumeInputProps {
  resumeText: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  selectedPresetId?: string;
  onSelectPreset: (preset: SampleResume) => void;
}

export const ResumeInput: React.FC<ResumeInputProps> = ({
  resumeText,
  onChange,
  onSubmit,
  isLoading,
  selectedPresetId,
  onSelectPreset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        onChange(content);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const wordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div id="resume-input-container" className="w-full">
      {/* Quick Preset Dossiers */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[#4F4C45] flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#3454D1]" />
            Quick-load candidate dossiers for instant testing:
          </label>
          {resumeText && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-xs text-[#8A857C] hover:text-[#B0492C] flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear text
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {SAMPLE_RESUMES.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                id={`preset-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className={`text-left p-3 rounded-md border transition-all text-xs ${
                  isSelected
                    ? "bg-[#FAF8F3] border-[#3454D1] ring-1 ring-[#3454D1]/20 shadow-2xs"
                    : "bg-[#F7F5EE] border-[#DDD8CE] hover:border-[#CDC6B5] hover:bg-[#F2EFE8]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#1C1B19]">{preset.name}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#3454D1]" />
                  )}
                </div>
                <div className="text-[#3454D1] font-medium text-[11px] mt-0.5">
                  {preset.role}
                </div>
                <p className="text-[#8A857C] text-[11px] mt-1 line-clamp-2 leading-relaxed">
                  {preset.summary}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dossier Editor Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-lg border transition-all ${
          isDragging
            ? "border-[#3454D1] bg-[#F2F5FF] ring-2 ring-[#3454D1]/20"
            : "border-[#CDC6B5] bg-[#FAF8F5] focus-within:border-[#3454D1] focus-within:ring-2 focus-within:ring-[#3454D1]/15"
        }`}
      >
        <textarea
          id="resume-textarea"
          value={resumeText}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste candidate resume, transcript, project list, or technical skills dossier here... (or drag & drop a .txt/.md file)"
          rows={9}
          disabled={isLoading}
          className="w-full p-4 sm:p-5 text-sm text-[#1C1B19] bg-transparent border-0 focus:outline-none resize-y leading-relaxed font-sans placeholder:text-[#9F9B91]"
        />

        {/* Toolbar & Action Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 py-3 border-t border-[#DDD8CE] bg-[#F4F2EC] rounded-b-lg">
          <div className="flex items-center gap-3 text-xs text-[#8A857C]">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EAE6DC] hover:bg-[#E0DBD0] text-[#1C1B19] text-xs font-medium border border-[#DDD8CE] transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#8A857C]" />
              Upload file
            </button>
            <span>
              {wordCount > 0 ? (
                <span className="font-mono text-[#4F4C45]">
                  {wordCount} words
                </span>
              ) : (
                "Supports text or markdown"
              )}
            </span>
          </div>

          <button
            type="button"
            id="btn-run-agent"
            onClick={onSubmit}
            disabled={isLoading || resumeText.trim().length < 20}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-md font-medium text-sm text-white bg-[#3454D1] hover:bg-[#2B45B3] active:bg-[#233A9B] transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Agent in Progress...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Evaluate & Rank Matches</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
