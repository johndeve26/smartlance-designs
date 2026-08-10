"use client";

import { useState } from "react";
import Link from "next/link";
import {
  adminCreateProposalFromRequestAction,
  adminProspectRequestClarificationAction,
} from "@/lib/admin/prospect-actions";

type RequestRow = {
  id: string;
  requestNumber: string;
  title: string;
  status: string;
  submittedAt: Date;
  briefSnapshotJson: unknown;
};

export function AdminProspectRequestPanel({ request }: { request: RequestRow }) {
  const [clarification, setClarification] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);

  async function sendClarification() {
    setLoading(true);
    try {
      await adminProspectRequestClarificationAction({
        requestId: request.id,
        body: clarification,
      });
      setClarification("");
    } finally {
      setLoading(false);
    }
  }

  async function createProposal() {
    setLoading(true);
    try {
      const result = await adminCreateProposalFromRequestAction(request.id);
      setProposalId(result.proposalId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-neutral-200 p-4 text-sm">
      <p className="font-medium">
        {request.title}{" "}
        <span className="font-normal text-neutral-500">({request.requestNumber})</span>
      </p>
      <p className="text-neutral-600">
        {request.status} · {new Date(request.submittedAt).toLocaleDateString()}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {proposalId ? (
          <Link
            href={`/admin/agency/proposals/${proposalId}`}
            className="rounded bg-[#F47A48] px-3 py-1 text-white"
          >
            Open proposal
          </Link>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={createProposal}
            className="rounded border border-neutral-300 px-3 py-1"
          >
            Create Proposal
          </button>
        )}
      </div>
      <div className="mt-4">
        <label className="block text-xs font-medium text-neutral-600">
          Ask for clarification
        </label>
        <textarea
          value={clarification}
          onChange={(e) => setClarification(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          disabled={loading || !clarification.trim()}
          onClick={sendClarification}
          className="mt-2 rounded bg-neutral-800 px-3 py-1 text-white disabled:opacity-50"
        >
          Send to prospect
        </button>
      </div>
    </div>
  );
}
