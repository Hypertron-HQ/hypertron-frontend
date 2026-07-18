/** @deprecated Legacy onboarding modal removed; use Create Workspace flow. Re-exports for settings/account. */
export {
  BUSINESS_NATURES,
  WIDGETS,
  BUSINESS_TO_WIDGETS,
} from "@/lib/onboarding-constants";
export {
  getOnboardingCompleted,
  setOnboardingCompleted,
  getOnboardingData,
  type OnboardingData,
} from "@/lib/onboarding-storage";
