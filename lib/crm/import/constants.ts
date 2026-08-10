export const CRM_CSV_IMPORT_MAX_ROWS = 5000;
export const CRM_CSV_IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const CRM_CSV_IMPORT_BATCH_SIZE = 100;
export const CRM_CSV_IMPORT_PREVIEW_ROWS = 50;
export const CRM_CSV_IMPORT_MAX_CELL_LENGTH = 8000;
export const CRM_CSV_IMPORT_MAX_ISSUES_STORED = 2000;

export const STANDARD_IMPORT_FIELDS = [
  "firstName",
  "lastName",
  "displayName",
  "email",
  "phone",
  "jobTitle",
  "companyName",
  "companyWebsite",
  "companyDomain",
  "country",
  "stateRegion",
  "city",
  "postalCode",
  "timezone",
  "linkedinUrl",
  "xUrl",
  "facebookUrl",
  "instagramUrl",
  "githubUrl",
  "youtubeUrl",
  "tiktokUrl",
  "lifecycle",
  "notes",
  "sourceDetail",
] as const;

export type StandardImportField = (typeof STANDARD_IMPORT_FIELDS)[number];

/** @deprecated use STANDARD_IMPORT_FIELDS */
export const IMPORTABLE_CSV_FIELDS = STANDARD_IMPORT_FIELDS;

export type ImportableCsvField = StandardImportField | `custom:${string}`;

export type ColumnMapping = Record<string, ImportableCsvField | "skip">;

export type ExistingContactStrategy = "SKIP" | "UPDATE_EMPTY" | "UPDATE_SELECTED";

export type ContactImportOptions = {
  existingStrategy: ExistingContactStrategy;
  updateFields?: (StandardImportField | `custom:${string}`)[];
  createMissingCompanies: boolean;
  createLeads: boolean;
  leadStatus: "NEW" | "ATTEMPTING" | "CONNECTED" | "QUALIFIED" | "UNQUALIFIED" | "BAD_TIMING" | "CLOSED";
  leadTemperature: "COLD" | "WARM" | "HOT";
  source: "MANUAL" | "OUTBOUND" | "REFERRAL" | "OTHER" | "SOCIAL" | "UPWORK";
  sourceDetail: string;
  assignOwnerId?: string | null;
  assignExistingOwner?: boolean;
};

export const DEFAULT_IMPORT_OPTIONS: ContactImportOptions = {
  existingStrategy: "SKIP",
  createMissingCompanies: true,
  createLeads: false,
  leadStatus: "NEW",
  leadTemperature: "COLD",
  source: "OUTBOUND",
  sourceDetail: "",
};

export type ImportRowAction =
  | "CREATE"
  | "UPDATE"
  | "SKIP_EXISTING"
  | "SKIP_ARCHIVED"
  | "DUPLICATE_IN_FILE"
  | "INVALID";

export type ParsedImportRow = {
  rowNumber: number;
  values: Record<string, string>;
};

export type ValidatedImportRow = {
  rowNumber: number;
  action: ImportRowAction;
  issues: Array<{ severity: "ERROR" | "WARNING"; code: string; field?: string; message: string }>;
  data: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    email?: string | null;
    emailNormalized?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    companyName?: string | null;
    companyWebsite?: string | null;
    companyDomain?: string | null;
    countryCode?: string | null;
    countryName?: string | null;
    stateRegion?: string | null;
    city?: string | null;
    postalCode?: string | null;
    timezone?: string | null;
    socialProfiles?: Partial<Record<string, string>>;
    customProperties?: Record<string, unknown>;
    lifecycle?: string | null;
    notes?: string | null;
    sourceDetail?: string | null;
  };
  existingContactId?: string | null;
  existingArchived?: boolean;
};

export type ImportValidationSummary = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  newContacts: number;
  existingContacts: number;
  duplicateInFile: number;
  willUpdate: number;
  willSkip: number;
  potentialCompanies: number;
  createdLeadsEstimate: number;
  duplicateFileWarning?: string | null;
};
