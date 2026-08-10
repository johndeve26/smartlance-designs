/** Client-facing labels for Client Success V1 */

export const MANAGED_WEBSITE_STATUS: Record<string, string> = {
  ACTIVE: "Active",
  MAINTENANCE: "Under maintenance",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
};

export const WEBSITE_CARE_STATUS: Record<string, string> = {
  NOT_ENROLLED: "Not enrolled",
  ACTIVE: "Active",
  PAUSED: "Paused",
  ENDED: "Ended",
};

export const WEBSITE_PLATFORM: Record<string, string> = {
  WORDPRESS: "WordPress",
  SHOPIFY: "Shopify",
  WEBFLOW: "Webflow",
  FRAMER: "Framer",
  CUSTOM: "Custom",
  OTHER: "Other",
};

export const OBSERVED_STATUS: Record<string, string> = {
  ONLINE: "Online",
  UNKNOWN: "Status unavailable",
  ISSUE_DETECTED: "Issue detected",
};

export const CARE_EVENT_TYPE: Record<string, string> = {
  MAINTENANCE: "Maintenance",
  UPDATE: "Update",
  BACKUP: "Backup",
  SECURITY: "Security",
  PERFORMANCE: "Performance",
  CONTENT: "Content",
  DEPLOYMENT: "Deployment",
  DOMAIN: "Domain",
  SSL: "SSL",
  OTHER: "Other",
};

export const CARE_EVENT_STATUS: Record<string, string> = {
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NEEDS_ATTENTION: "Needs attention",
};

export const SUPPORT_CATEGORY: Record<string, string> = {
  WEBSITE_CHANGE: "Website change",
  CONTENT_UPDATE: "Content update",
  TECHNICAL_ISSUE: "Technical issue",
  QUESTION: "Question",
  ACCESS_HELP: "Access help",
  NEW_FEATURE: "New functionality",
  OTHER: "Other",
};

export const SUPPORT_CATEGORY_HELP: Record<string, string> = {
  WEBSITE_CHANGE: "Small edits or updates to your website.",
  CONTENT_UPDATE: "Text, images, or content changes.",
  TECHNICAL_ISSUE: "Something isn't working correctly.",
  QUESTION: "You need guidance or information.",
  ACCESS_HELP: "Help with website or account access.",
  NEW_FEATURE: "We'll review whether this is covered by your current service.",
  OTHER: "Anything else we can help with.",
};

export const SUPPORT_PRIORITY: Record<string, string> = {
  NORMAL: "Normal",
  IMPORTANT: "Important",
  URGENT: "Urgent",
};

export const SUPPORT_STATUS: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_ON_CLIENT: "Waiting for you",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export const SUPPORT_WAITING_ON: Record<string, string> = {
  SMARTLANCE: "Smartlance",
  CLIENT: "You",
  NONE: "None",
};

export const WEBSITE_CLIENT_ROLE: Record<string, string> = {
  VIEWER: "Viewer",
  MEMBER: "Member",
  WEBSITE_ADMIN: "Website admin",
};
