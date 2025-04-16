export interface Analysis {
  claims: string[];
  evidence: string[];
  structure: string;
  suggestions: string[];
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ContentType = 'text' | 'image' | 'graph';
export type VisualType = 'illustration' | 'infographic' | 'statistics';

export interface Claim {
  statement: string;
  keywords: string[];
}

export interface Evidence {
  statement: string;
  keywords: string[];
  subEvidence?: Evidence[];
}

export interface ClaimEvaluation {
  feedback: string;
  missedKeywords: string[];
  logicalErrors: string[];
}

export interface EvidenceEvaluation {
  feedback: string;
  missedKeywords: string[];
  missedEvidence: string[];
  totalEvidenceCount: number;
  submittedEvidenceCount: number;
  logicalErrors: string[];
}

export interface OverallStructure {
  feedback: string;
  logicalErrors: string[];
}

export interface Evaluation {
  claimEvaluation: ClaimEvaluation;
  evidenceEvaluation: EvidenceEvaluation;
  overallStructure: OverallStructure;
} 