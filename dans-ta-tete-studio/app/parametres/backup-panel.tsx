"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { useData } from "@/components/data-provider";
import { Button, Card } from "@/components/ui";
import { getStore } from "@/lib/repositories/store";
import { parseBackup } from "@/lib/repositories/backup";

export function BackupPanel() {
  const { refresh, ready } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function exporter() {
    const backup = await getStore().exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dans-ta-tete-studio_${backup.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ tone: "ok", text: "Sauvegarde exportée." });
  }

  async function importer(file: File) {
    try {
      const backup = parseBackup(JSON.parse(await file.text()));
      if (!confirm("Importer cette sauvegarde remplacera toutes les données actuelles. Continuer ?")) return;
      await getStore().importAll(backup);
      refresh();
      setMsg({ tone: "ok", text: "Sauvegarde importée." });
    } catch {
      setMsg({ tone: "err", text: "Fichier invalide : ce n'est pas une sauvegarde Dans ta tête Studio." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function effacerDemo() {
    if (!confirm("Supprimer toutes les données de démonstration ? Tes propres données sont conservées.")) return;
    const n = await getStore().clearDemo();
    try {
      localStorage.setItem("dtt:demo-cleared", "1");
    } catch {
      /* sans incidence */
    }
    refresh();
    setMsg({ tone: "ok", text: `${n} élément(s) de démonstration supprimé(s).` });
  }

  return (
    <Card>
      <p className="text-sm text-muted">
        Phase 1 : tes projets sont sauvegardés automatiquement sur cet appareil (dans le navigateur). Exporte régulièrement une copie.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={exporter} disabled={!ready}>
          <Download className="size-4" aria-hidden /> Exporter (JSON)
        </Button>
        <Button variant="ghost" onClick={() => fileRef.current?.click()} disabled={!ready}>
          <Upload className="size-4" aria-hidden /> Importer
        </Button>
        <Button variant="danger" onClick={effacerDemo} disabled={!ready}>
          <Trash2 className="size-4" aria-hidden /> Effacer la démo
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importer(e.target.files[0])} />
      </div>
      {msg && (
        <p role="status" className={`mt-3 text-sm ${msg.tone === "ok" ? "text-ok" : "text-red-300"}`}>
          {msg.text}
        </p>
      )}
    </Card>
  );
}
