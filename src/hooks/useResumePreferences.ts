"use client";

import { useCallback, useEffect, useState } from "react";
import { getTemplate } from "@/config/templates";
import type { ThemeConfig } from "@/types/theme";
import type { LayoutConfig } from "@/types/layout";

export function useResumePreferences() {
  const [theme, setTheme] = useState<ThemeConfig>(() => getTemplate("classico").theme);
  const [layout, setLayout] = useState<LayoutConfig>(() => getTemplate("classico").layout);
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/templates?default=true");
    const data = await res.json();
    if (res.ok && data.themeJson && data.layoutJson) {
      setTheme(data.themeJson as ThemeConfig);
      setLayout(data.layoutJson as LayoutConfig);
      setTemplateId(data.id ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveAsDefault = useCallback(
    async (name = "Meu estilo padrão") => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          themeJson: theme,
          layoutJson: layout,
          isDefault: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTemplateId(data.id);
      }
      return res.ok;
    },
    [theme, layout]
  );

  return {
    theme,
    setTheme,
    layout,
    setLayout,
    loading,
    templateId,
    saveAsDefault,
    reload: load,
  };
}
