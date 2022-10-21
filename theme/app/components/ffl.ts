import type { KatexOptions } from 'katex';
import katex from 'katex';

type MathMacros = Record<string, string | { macro: string; className?: string; color?: string }>;

function getMathMacros(macros: MathMacros): Record<string, string> {
  return Object.fromEntries(
    Object.entries(macros).map(([key, value]) => {
      if (typeof value === 'string') return [key, value];
      let { macro } = value;
      if (value.color) {
        macro = `\\textcolor{${value.color}}{${macro}}`;
      }
      if (value.className) {
        macro = `{\\htmlClass{${value.className}}{${macro}}}`;
      }
      return [key, macro];
    })
  );
}

export function renderToString(value: string, opts?: KatexOptions): string {
  const macros = getMathMacros(opts?.macros ?? {});
  const html = katex.renderToString(value, {
    displayMode: opts?.displayMode,
    macros: { ...macros },
    strict: opts?.strict,
  });
  return html;
}

export function render(value: string, node: HTMLElement, opts?: KatexOptions) {
  const macros = getMathMacros(opts?.macros ?? {});
  katex.render(value, node, { displayMode: opts?.displayMode, macros: { ...macros } });
}
