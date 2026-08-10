"use client";

import { useState } from "react";
import { downloadImportRejectedRowsAction } from "@/lib/admin/crm-import-actions";

export function ImportRejectedDownloadButton({ importId }: { importId: string }) {
  const [pending, setPending] = useState(false);

  async function download() {
    setPending(true);
    const res = await downloadImportRejectedRowsAction(importId);
    setPending(false);
    if (!res.ok) return;
    const blob = new Blob([res.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" className="admin-btn admin-btn-secondary" disabled={pending} onClick={download}>
      {pending ? "Preparing…" : "Download rejected rows CSV"}
    </button>
  );
}
