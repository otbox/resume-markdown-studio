export interface ResumeHeader {
  name: string;
  role: string;
  contacts: string[];
}

export interface ResumeSection {
  id: string;
  label: string;
  content: string;
}

export interface ParsedResume {
  header: ResumeHeader;
  sections: ResumeSection[];
}

export function parseResume(markdown: string): ParsedResume {
  const lines = markdown.split("\n");
  let name = "";
  let role = "";
  const contacts: string[] = [];
  const sections: ResumeSection[] = [];

  let currentSection: ResumeSection | null = null;
  let contentLines: string[] = [];
  let headerParsed = false;

  const flushSection = () => {
    if (currentSection) {
      currentSection.content = contentLines.join("\n").trim();
      sections.push(currentSection);
      contentLines = [];
    }
  };

  for (const line of lines) {
    if (!headerParsed && line.startsWith("# ")) {
      const headerParts = line.slice(2).split("|").map((p) => p.trim());
      name = headerParts[0] ?? "";
      role = headerParts[1] ?? "";
      continue;
    }

    if (!headerParsed && line.startsWith("> ")) {
      contacts.push(line.slice(2).trim());
      continue;
    }

    if (!headerParsed && line.trim() === "" && name) {
      headerParsed = true;
      continue;
    }

    if (line.startsWith("## ")) {
      flushSection();
      const heading = line.slice(3).trim();
      const [id, ...labelParts] = heading.split("|");
      currentSection = {
        id: id.trim(),
        label: labelParts.join("|").trim() || id.trim(),
        content: "",
      };
      continue;
    }

    if (currentSection) {
      contentLines.push(line);
    }
  }

  flushSection();

  return {
    header: { name, role, contacts },
    sections,
  };
}
