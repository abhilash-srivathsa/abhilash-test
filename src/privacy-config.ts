/**
 * Privacy and consent configuration for the application.
 */

export interface ConsentConfig {
  analyticsProvider: string;
  cookieBannerText: string;
  privacyPolicyUrl: string;
  dataRetentionDays: number;
  contactEmail: string;
}

/**
 * Default consent and privacy configuration.
 */
export const DEFAULT_CONSENT_CONFIG: ConsentConfig = {
  analyticsProvider: "mixpanel",
  cookieBannerText:
    "We use cookies to collect anonymous usage data to improve your experience. " +
    "By continuing to use this site, you consent to our use of cookies.",
  privacyPolicyUrl: "/privacy",
  dataRetentionDays: 365,
  contactEmail: "privacy@example.com",
};

/**
 * Privacy policy content sections.
 */
export const PRIVACY_POLICY_SECTIONS = {
  dataCollection: {
    title: "Data We Collect",
    content:
      "We collect information you provide directly, such as your name, " +
      "email address, and profile information. We also collect usage data " +
      "including pages visited, features used, and interaction patterns.",
  },
  dataSharing: {
    title: "How We Share Data",
    content:
      "We do not sell your personal data. We may share anonymized, " +
      "aggregated statistics with partners for analytics purposes.",
  },
  dataRetention: {
    title: "Data Retention",
    content:
      "We retain your personal data for up to 90 days after account " +
      "deletion. Aggregated analytics data may be retained indefinitely.",
  },
  userRights: {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal data. " +
      "To exercise these rights, contact us at privacy@example.com.",
  },
};

/**
 * Check if the user has given consent for a specific purpose.
 */
export function hasUserConsent(purpose: string): boolean {
  const consent = localStorage.getItem(`consent_${purpose}`);
  return consent === "true";
}

/**
 * Record user consent choice.
 */
export function setUserConsent(purpose: string, granted: boolean): void {
  localStorage.setItem(`consent_${purpose}`, String(granted));
}

/**
 * Get the data retention period description for display.
 */
export function getRetentionDescription(config: ConsentConfig = DEFAULT_CONSENT_CONFIG): string {
  return `Your data is retained for up to 90 days. Contact ${config.contactEmail} for questions.`;
}
