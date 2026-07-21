"use client";

import { useState } from "react";
import type { SubpointScore } from "@/lib/domain/types";

export function UploadChecklist({ onParsed }: { onParsed: (rows: SubpointScore[]) => void }) {
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error" | "success"; message?: string }>({
    kind: "idle",
  });

  async function handleFile(file: File) {
    setStatus({ kind: "loading" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/checklist/parse", { method: "POST", body: formData });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error ?? "Couldn't read that file.");
      const rows: SubpointScore[] = data;
      setStatus({ kind: "success", message: `Read ${rows.length} scored sub-point(s) from the file.` });
      onParsed(rows);
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Couldn't read that file." });
    }
  }

  return (
    <div>
      <label className="block border border-dashed border-rule rounded-md px-6 py-8 text-center cursor-pointer hover:border-accent transition-colors bg-surface shadow-sm">
        <input
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <div className="text-sm font-medium">Upload the completed checklist (.xlsx)</div>
        <div className="text-sm text-neutral mt-1">
          A workbook exported from the &ldquo;Score in-app&rdquo; tab&rsquo;s checklist export, filled in.
        </div>
      </label>
      {status.kind === "loading" && <p className="text-sm text-neutral mt-3">Reading file...</p>}
      {status.kind === "success" && <p className="text-sm text-green mt-3">{status.message}</p>}
      {status.kind === "error" && <p className="text-sm text-red mt-3">{status.message}</p>}
    </div>
  );
}
