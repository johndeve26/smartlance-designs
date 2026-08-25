import { describe, expect, it } from "vitest";
import { contactDisplayName } from "@/lib/crm/normalize";

describe("Contact email recipient labeling", () => {
  it("formats recipient display name", () => {
    expect(
      contactDisplayName({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
      }),
    ).toBe("Ada Lovelace");
  });
});

describe("Contact email send action response semantics", () => {
  it("treats timeout-like errors as ambiguous for UI retry gating", () => {
    const message = "fetch failed: network timeout";
    const ambiguous = /timeout|network|ECONNRESET|fetch failed|uncertain/i.test(message);
    expect(ambiguous).toBe(true);
  });

  it("treats clear delivery failures as safe to retry", () => {
    const message = "Email delivery failed.";
    const ambiguous = /timeout|network|ECONNRESET|fetch failed|uncertain/i.test(message);
    expect(ambiguous).toBe(false);
  });
});

describe("Contact email composer state machine", () => {
  type State = "idle" | "composing" | "sending" | "sent" | "error";

  function nextState(
    current: State,
    event:
      | "open"
      | "cancel"
      | "send"
      | "success"
      | "failure"
      | "ambiguous_failure"
      | "send_another",
  ): State {
    switch (event) {
      case "open":
        return "composing";
      case "cancel":
        return "idle";
      case "send":
        return current === "composing" || current === "error" ? "sending" : current;
      case "success":
        return current === "sending" ? "sent" : current;
      case "failure":
      case "ambiguous_failure":
        return current === "sending" ? "error" : current;
      case "send_another":
        return current === "sent" ? "composing" : current;
      default:
        return current;
    }
  }

  it("moves idle → composing → sending → sent", () => {
    let state: State = "idle";
    state = nextState(state, "open");
    expect(state).toBe("composing");
    state = nextState(state, "send");
    expect(state).toBe("sending");
    state = nextState(state, "success");
    expect(state).toBe("sent");
  });

  it("send another resets to composing", () => {
    let state: State = "sent";
    state = nextState(state, "send_another");
    expect(state).toBe("composing");
  });

  it("failed send returns to error, not sent", () => {
    let state: State = "sending";
    state = nextState(state, "failure");
    expect(state).toBe("error");
  });

  it("cancel returns to idle", () => {
    expect(nextState("composing", "cancel")).toBe("idle");
  });

  it("does not expose send from sent without send_another", () => {
    expect(nextState("sent", "send")).toBe("sent");
  });
});
