-- Topic Intelligence calibration: preserve AI recommendation + editorial feedback

CREATE TYPE "TopicEditorialFeedback" AS ENUM (
  'GOOD_RECOMMENDATION',
  'WRONG_FORMAT',
  'DUPLICATE_MISSED',
  'WEAK_ANGLE',
  'IRRELEVANT',
  'STRONG_REFRESH',
  'USEFUL_SOURCE'
);

ALTER TABLE "EditorialOpportunity"
  ADD COLUMN IF NOT EXISTS "aiOriginalRecommendation" "TopicRecommendation",
  ADD COLUMN IF NOT EXISTS "humanDecisionNote" TEXT,
  ADD COLUMN IF NOT EXISTS "editorialFeedback" "TopicEditorialFeedback",
  ADD COLUMN IF NOT EXISTS "editorialFeedbackNote" TEXT;
