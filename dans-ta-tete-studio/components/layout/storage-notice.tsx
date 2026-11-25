"use client";

import { CircleAlert } from "lucide-react";
import { useData } from "@/components/data-provider";

export function StorageNotice() {
  const { error } = useData();
  if (!error) return null;
  return (
    <div role="alert" className="mb-6 flex gap-3 rounded-card border border-warn/40 bg-warn/10 p-4 text-sm text-warn">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {error}
    </div>
  );
}
