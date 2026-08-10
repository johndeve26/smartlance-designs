import { describe, expect, it } from "vitest";
import {
  classifySendFailure,
  shouldRetryExecution,
  isSmtpAuthOrConfigFailure,
  AMBIGUOUS_FAILURE_CODES,
} from "@/lib/crm/sequences/failure-classification";
import { POST_SEND_PERSISTENCE_FAILURE } from "@/lib/crm/sequences/constants";

describe("failure classification", () => {
  it("classifies auth failure as permanent", () => {
    expect(classifySendFailure("AUTH_FAILED")).toBe("PERMANENT");
    expect(shouldRetryExecution({ category: "PERMANENT", attemptCount: 1 })).toBe(false);
  });

  it("classifies post-send persistence failure as ambiguous", () => {
    expect(classifySendFailure(POST_SEND_PERSISTENCE_FAILURE)).toBe(
      "AMBIGUOUS_DO_NOT_AUTO_RETRY",
    );
    expect(AMBIGUOUS_FAILURE_CODES.has(POST_SEND_PERSISTENCE_FAILURE)).toBe(true);
    expect(
      shouldRetryExecution({
        category: "AMBIGUOUS_DO_NOT_AUTO_RETRY",
        attemptCount: 1,
      }),
    ).toBe(false);
  });

  it("allows bounded retry for transient failures", () => {
    expect(classifySendFailure("DELIVERY_FAILED")).toBe("TRANSIENT_SAFE_TO_RETRY");
    expect(shouldRetryExecution({ category: "TRANSIENT_SAFE_TO_RETRY", attemptCount: 1 })).toBe(
      true,
    );
    expect(shouldRetryExecution({ category: "TRANSIENT_SAFE_TO_RETRY", attemptCount: 3 })).toBe(
      false,
    );
  });

  it("detects SMTP config failures for run abort", () => {
    expect(isSmtpAuthOrConfigFailure("AUTH_FAILED")).toBe(true);
    expect(isSmtpAuthOrConfigFailure("DELIVERY_FAILED")).toBe(false);
  });
});
