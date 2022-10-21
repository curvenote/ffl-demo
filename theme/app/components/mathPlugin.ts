import type { Plugin } from 'unified';
import type { VFile } from 'vfile';
import type { Root } from 'mdast';
import type { Math, InlineMath, Node } from 'myst-spec';
import { selectAll } from 'unist-util-select';
import { fileWarn } from 'myst-common';
import { renderToString } from './ffl';

const TRANSFORM_NAME = 'myst-transforms:math';

type Options = {
  macros?: Record<string, string>;
};

const buildInMacros = {
  '\\mbox': '\\text{#1}', // mbox is not supported in KaTeX, this is an OK fallback
};

type RenderResult = { html?: string; warnings?: string[]; error?: string };

function tryRender(node: Node, value: string, macros: Record<string, any>): RenderResult {
  const displayMode = node.type === 'math';
  const warnings: string[] = [];
  try {
    const html = renderToString(value, {
      displayMode,
      macros: { ...buildInMacros, ...macros },
      strict: (f: string, m: string) => {
        warnings.push(`${f}, ${m}`);
      },
    });
    if (warnings.length === 0) return { html };
    return { warnings, html };
  } catch (error) {
    const { message } = error as unknown as Error;
    return { error: message.replace('KaTeX parse error: ', '') };
  }
}

function renderEquation(file: VFile, node: Math | InlineMath, opts?: Options) {
  let value = node.value;
  if (!value) {
    const message = 'No input for math node';
    fileWarn(file, message, {
      node,
      note: node.value,
      source: TRANSFORM_NAME,
      fatal: true,
    });
    (node as any).error = true;
    (node as any).message = message;
    return;
  }
  const macros = opts?.macros as any;
  const result = tryRender(node, value, macros);
  if (result.html) {
    (node as any).html = result.html;
  }
  if (result.warnings) {
    result.warnings.forEach((message) => {
      fileWarn(file, message, { node, note: node.value, source: 'KaTeX' });
    });
  }
  if (result.error) {
    fileWarn(file, result.error, { node, note: node.value, source: 'KaTeX', fatal: true });
    (node as any).error = true;
    (node as any).message = result.error;
  }
}

export function mathTransform(mdast: Root, file: VFile, opts?: Options) {
  const nodes = selectAll('math,inlineMath', mdast) as (Math | InlineMath)[];
  nodes.forEach((node) => {
    renderEquation(file, node, opts);
  });
}

export const mathPlugin: Plugin<[Options?], Root, Root> = (opts) => (tree, file) => {
  mathTransform(tree, file, opts);
};
