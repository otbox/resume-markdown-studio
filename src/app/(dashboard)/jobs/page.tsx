"use client";

import Link from "next/link";
import { JobHistoryList } from "@/components/jobs/JobHistoryList";

export default function JobsHistoryPage() {
  return (
    <div style={{ maxWidth: 960 }}>
      <JobHistoryList
        title="Histórico de vagas"
        subtitle="Vagas analisadas anteriormente. Reabra o currículo ou gere uma nova versão adaptada."
        showNewJobButton
      />
    </div>
  );
}
