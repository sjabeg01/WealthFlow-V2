import {
  type FinalType,
  type ConfidenceLevel,
  type ClassificationContext,
  type ClassificationResult,
} from './classificationTypes';
import { runScoringEngine } from './scoringEngine';

export {
  type FinalType,
  type ConfidenceLevel,
  type ClassificationContext,
  type ClassificationResult,
};

export function deriveFinalType(context: ClassificationContext): ClassificationResult {
  // STAGE 1: OVERRIDES
  if (context.user_category_type === 'expense_only') {
    return { final_type: 'expense', confidence: 'high', confidence_score: 100, classification_reason: 'User override', score_breakdown: ['Override (+100)'], merchant_clean_name: null };
  }
  if (context.user_category_type === 'income_only') {
    return { final_type: 'income', confidence: 'high', confidence_score: 100, classification_reason: 'User override', score_breakdown: ['Override (+100)'], merchant_clean_name: null };
  }

  // STAGE 2: SCORING ENGINE
  const result = runScoringEngine(context);

  if ((result.confidence === 'high' || result.confidence === 'medium') && result.suggestedType) {
    return {
      final_type: result.suggestedType as any,
      confidence: result.confidence,
      confidence_score: result.score,
      classification_reason: `Scoring engine (${result.confidence}): score ${result.score}`,
      score_breakdown: result.breakdown,
      merchant_clean_name: result.merchantMatch,
    };
  }

  // STAGE 3: NEEDS REVIEW
  return {
    final_type: 'needs_review',
    confidence: 'low',
    confidence_score: result.score,
    classification_reason: `Score too low: ${result.score}`,
    score_breakdown: result.breakdown,
    merchant_clean_name: result.merchantMatch,
  };
}
