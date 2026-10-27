"use client";

import { JobHistoryList } from "@/components/jobs/JobHistoryList";

export function RecentJobsSection() {
  return (
    <JobHistoryList
      limit={5}
      title="Últimas vagas"
      subtitle="Vagas analisadas recentemente."
      showViewAllLink
    />
  );
}
