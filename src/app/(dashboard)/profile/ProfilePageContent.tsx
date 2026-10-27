"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PdfImportForm } from "@/components/profile/PdfImportForm";

interface Profile {
  fullName: string;
  headline?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  summary?: string | null;
}

export default function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get("onboarding") === "1";
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setProfile(res.ok ? data : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem" }}>
        {isOnboarding ? "Configure seu perfil" : "Meu perfil"}
      </h1>
      {isOnboarding && (
        <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
          Importe seu currículo em PDF ou preencha manualmente para começar.
        </p>
      )}

      <div style={{ display: "grid", gap: "1.5rem", maxWidth: 800 }}>
        <PdfImportForm onImported={() => { loadProfile(); router.refresh(); }} />
        <ProfileForm
          initial={profile ?? undefined}
          onSaved={() => { loadProfile(); router.refresh(); }}
        />
      </div>
    </div>
  );
}
