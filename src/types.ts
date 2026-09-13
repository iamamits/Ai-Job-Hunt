export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  department?: string;
  salaryRange?: string;
  description: string;
  required_skills: string[];
}

export interface Candidate {
  resumeText: string;
  targetRoles?: string[];
  experienceLevel?: string;
}

export interface MatchScoreEvaluation {
  score: number;
  reason: string;
  coreRequirements?: string[];
  matchedExperience?: string[];
  gapAnalysis?: string;
}

export interface MatchResult {
  jobId: string;
  job: Job;
  score: number;
  reason: string;
  coreRequirements?: string[];
  matchedExperience?: string[];
  gapAnalysis?: string;
  coverLetter?: string;
  isTopMatch: boolean;
  status: 'scored' | 'drafted' | 'pending';
}

export interface AgentRunProgress {
  step: 'idle' | 'analyzing_resume' | 'scoring_jobs' | 'ranking' | 'generating_cover_letters' | 'completed' | 'error';
  currentJobIndex?: number;
  totalJobs?: number;
  currentJobTitle?: string;
  message?: string;
}

export interface AgentRunResponse {
  success: boolean;
  totalEvaluated: number;
  results: MatchResult[];
  candidateSummary?: string;
  error?: string;
}
