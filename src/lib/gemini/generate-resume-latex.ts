import { generateWithFallback } from "./client";
import type { JobAnalysis } from "@/types/profile";

/**
 * Template LaTeX baseado em github.com/celiobjunior/resume-template (Apache 2.0),
 * o mesmo padrão adotado nos prompts do repositório nextround. O modelo copia o
 * preâmbulo sem mudar nada (só o idioma do babel) e preenche o corpo.
 */
const LATEX_TEMPLATE = String.raw`% GitHub Repo: https://github.com/celiobjunior/resume-template
% Copyright © 2025 Celio B Junior. Licensed under the Apache License, Version 2.0.
\documentclass[a4paper,10pt]{article}

\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage[portuguese]{babel}

\usepackage{geometry}
\usepackage{parskip}
\usepackage{microtype}
\usepackage{enumitem}
\usepackage{titlesec}
\usepackage{array}
\usepackage{tabularx}

\usepackage{hyperref}
\usepackage{bookmark}
\usepackage{xurl}

\geometry{top=1.5cm, bottom=1.5cm, left=1.5cm, right=1.5cm}
\setcounter{secnumdepth}{0}
\setlist[itemize]{leftmargin=0.75em, itemsep=0.2em, topsep=0.25em, parsep=0em, partopsep=0em}
\pagestyle{empty}

\hypersetup{colorlinks=true, linkcolor=black, urlcolor=black, citecolor=black, bookmarksdepth=2}

\titleformat{\section}{\Large\bfseries}{}{0em}{}[\titlerule\vspace{0.5ex}]
\titleformat{\subsection}{\normalsize\bfseries}{}{0em}{}
\titlespacing*{\subsection}{0pt}{0.35em}{0.15em}

\newcounter{cventry}
\newcommand{\cventry}[4]{%
    \refstepcounter{cventry}%
    \phantomsection%
    \pdfbookmark[2]{#1}{cventry-\thecventry}%
    \noindent\begin{tabularx}{\textwidth}{@{}>{\raggedright\arraybackslash}X >{\raggedleft\arraybackslash}X@{}}
    \textbf{#1} & #2 \\
    \textit{#3} & \textit{#4} \\
    \end{tabularx}
}

\begin{document}
% ... corpo do currículo ...
\end{document}`;

const GENERATE_PROMPT = `Você é um recrutador técnico sênior que escreve currículos em LaTeX, otimizados para o robô (ATS) e para o recrutador. Receberá um PERFIL (fonte de verdade), uma ANÁLISE DA VAGA e o TEXTO DA VAGA.

Objetivo: escrever, em LaTeX e usando o TEMPLATE do fim, um currículo para ESTA vaga, SEM inventar nada.

Regras de conteúdo:
1. Nunca invente experiência, empresa, cargo, data, número, certificação, tecnologia ou idioma que não esteja no PERFIL.
2. Palavras-chave: use os termos exatos da ANÁLISE DA VAGA, só onde forem verdadeiros para a pessoa.
3. Título: na linha abaixo do nome, o nome exato do cargo da vaga.
4. Resumo: no máximo 3 linhas. Quem a pessoa é, o que domina (com palavras-chave), o que entrega.
5. Bullets: verbo de ação + o que fez + resultado com número quando houver. Nunca "responsável por" nem "fazia".
6. Dentro de cada seção, ordene pelo que a vaga pede primeiro; nas datas, do mais recente para o mais antigo.
7. Tudo em 1 página A4. Se não couber, corte os bullets menos ligados à vaga.

Regras de LaTeX:
8. Copie o preâmbulo do TEMPLATE (do \\documentclass até antes de \\begin{document}) sem mudar nada, exceto o idioma do babel: portuguese para vaga em português, english para vaga em inglês.
9. Cada experiência, projeto, atividade e formação usa \\cventry{Organização}{Local}{Cargo}{Datas}, seguido de itemize com os bullets. Não crie tabelas, colunas, imagens, ícones ou barras de habilidade além do template.
10. Cabeçalho centralizado: nome; título; cidade, telefone, e-mail (\\href mailto), linkedin e github (só se houver), separados por {\\textbullet}. Nunca inclua CPF, RG, idade, estado civil ou endereço completo.
11. Seções nesta ordem: Resumo, Experiência, Projetos, Atividades de Liderança, Habilidades, Educação. Se a pessoa busca estágio ou primeira vaga: Resumo, Educação, Projetos, Experiência, Atividades de Liderança, Habilidades. Omita seções sem conteúdo.
12. Escape os caracteres especiais no texto: \\%, \\&, \\$, \\#, \\_ (ex.: "C#" vira "C\\#", "30%" vira "30\\%").
13. Nunca comece um \\item, nem a linha após \\\\, com texto entre colchetes: use chaves, ex.: {[...]}.
14. Escreva no idioma da vaga, inclusive os títulos das seções.
15. O arquivo precisa compilar com pdflatex sem erros. Não deixe no corpo os textos de exemplo do TEMPLATE.
16. NÃO use \\input, \\include, \\write18, \\openin ou \\openout. O serviço rejeita esses comandos.

Devolva APENAS o arquivo .tex completo, sem cercas de código, sem comentários de explicação e sem texto fora do documento.

TEMPLATE:
${LATEX_TEMPLATE}`;

/** Remove cercas de código se o modelo insistir em devolvê-las. */
function stripFences(text: string): string {
  let out = text.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```(?:latex|tex)?\n?/, "").replace(/\n?```$/, "");
  }
  return out.trim();
}

export async function generateTailoredResumeLatex(
  profileMarkdown: string,
  jobAnalysis: JobAnalysis,
  jobText: string
): Promise<string> {
  const latex = await generateWithFallback((model) =>
    model.generateContent(
      `${GENERATE_PROMPT}

PERFIL (fonte de verdade):
${profileMarkdown}

TEXTO DA VAGA:
${jobText}

ANÁLISE DA VAGA:
${JSON.stringify(jobAnalysis, null, 2)}`
    )
  );
  return stripFences(latex);
}
