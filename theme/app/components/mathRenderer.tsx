import { useFrontmatter } from '@curvenote/ui-providers';
import type { InlineMath, Math } from 'myst-spec';
import type { NodeRenderer } from 'myst-to-react';
import { useEffect, useRef } from 'react';
import { render } from './ffl';

function MathRenderer({ value, displayMode }: { value: string; displayMode: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const frontmatter = useFrontmatter();
  const macros = frontmatter?.math as any;
  useEffect(() => {
    if (!ref.current) return;
    try {
      render(value, ref.current, { displayMode, macros });
    } catch (error) {
      // pass
    }
  }, [value, displayMode, ref, macros]);
  if (displayMode) return <div ref={ref} />;
  return <span ref={ref} />;
}

type MathLike = (InlineMath | Math) & {
  error?: boolean;
  message?: string;
  html?: string;
};

const mathRenderer: NodeRenderer<MathLike> = (node) => {
  return (
    <MathRenderer key={node.key} value={node.value as string} displayMode={node.type === 'math'} />
  );
};

const MATH_RENDERERS = {
  math: mathRenderer,
  inlineMath: mathRenderer,
};

export default MATH_RENDERERS;
