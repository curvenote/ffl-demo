import type { NodeRenderer } from 'myst-to-react';
import { CopyIcon, useParse, CodeBlock, DEFAULT_RENDERERS } from 'myst-to-react';
import { VFile } from 'vfile';
import type { LatexResult } from 'myst-to-tex'; // Only import the type!!
import type { VFileMessage } from 'vfile-message';
import yaml from 'js-yaml';
import type { References } from '@curvenote/site-common';
import type { PageFrontmatter } from 'myst-frontmatter';
import React, { useEffect, useRef, useState } from 'react';
import classnames from 'classnames';
import ExclamationIcon from '@heroicons/react/outline/ExclamationIcon';
import ExclamationCircleIcon from '@heroicons/react/outline/ExclamationCircleIcon';
import InformationCircleIcon from '@heroicons/react/outline/InformationCircleIcon';
import { ReferencesProvider } from '@curvenote/ui-providers';
import { mathPlugin } from './mathPlugin';
import MATH_RENDERERS from './mathRenderer';

const CUSTOM_RENDERERS = { ...DEFAULT_RENDERERS, ...MATH_RENDERERS };

async function parse(text: string, defaultFrontmatter?: PageFrontmatter) {
  // Ensure that any imports from myst are async and scoped to this function
  const { visit } = await import('unist-util-visit');
  const { unified } = await import('unified');
  const { MyST } = await import('mystjs');
  const {
    // mathPlugin, // Don't import the default!
    footnotesPlugin,
    keysPlugin,
    basicTransformationsPlugin,
    enumerateTargetsPlugin,
    resolveReferencesPlugin,
    WikiTransformer,
    DOITransformer,
    RRIDTransformer,
    linksPlugin,
    ReferenceState,
    getFrontmatter,
  } = await import('myst-transforms');
  const { default: mystToTex } = await import('myst-to-tex');
  const myst = new MyST();
  const mdast = myst.parse(text);
  const linkTransforms = [new WikiTransformer(), new DOITransformer(), new RRIDTransformer()];
  // For the mdast that we show, duplicate, strip positions and dump to yaml
  // Also run some of the transforms, like the links
  const mdastPre = JSON.parse(JSON.stringify(mdast));
  unified().use(linksPlugin, { transformers: linkTransforms }).runSync(mdastPre);
  visit(mdastPre, (n) => delete n.position);
  const mdastString = yaml.dump(mdastPre);
  const file = new VFile();
  const references = {
    cite: { order: [], data: {} },
    footnotes: {},
  };
  const { frontmatter } = getFrontmatter(mdast, { removeYaml: true, removeHeading: false });
  const state = new ReferenceState({
    numbering: frontmatter.numbering ?? defaultFrontmatter?.numbering,
    file,
  });
  unified()
    .use(basicTransformationsPlugin)
    .use(mathPlugin, { macros: frontmatter?.math ?? {} }) // This must happen before enumeration, as it can add labels
    .use(enumerateTargetsPlugin, { state })
    .use(linksPlugin, { transformers: linkTransforms })
    .use(footnotesPlugin, { references })
    .use(resolveReferencesPlugin, { state })
    .use(keysPlugin)
    .runSync(mdast as any, file);
  const tex = unified()
    .use(mystToTex)
    .stringify(mdast as any).result as LatexResult;
  return {
    frontmatter,
    mdast,
    yaml: mdastString,
    references: { ...references, article: mdast } as References,
    tex: tex.value,
    warnings: file.messages,
  };
}

export function MySTRenderer({ value, numbering }: { value: string; numbering: any }) {
  const area = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState<string>(value.trim());
  const [frontmatter, setFrontmatter] = useState<PageFrontmatter>();
  const [references, setReferences] = useState<References>({});
  const [mdast, setMdast] = useState<any>();
  const [mdastYaml, setYaml] = useState<string>('Loading...');
  const [tex, setTex] = useState<string>('Loading...');
  const [warnings, setWarnings] = useState<VFileMessage[]>([]);
  const [previewType, setPreviewType] = useState('DEMO');

  useEffect(() => {
    const ref = { current: true };
    parse(text, { numbering }).then((result) => {
      if (!ref.current) return;
      setFrontmatter(result.frontmatter);
      setMdast(result.mdast);
      setYaml(result.yaml);
      setReferences(result.references);
      setTex(result.tex);
      setWarnings(result.warnings);
    });
    return () => {
      ref.current = false;
    };
  }, [text]);

  const content = useParse(mdast, CUSTOM_RENDERERS);

  useEffect(() => {
    if (!area.current) return;
    area.current.style.height = 'auto'; // for the scroll area in the next step!
    area.current.style.height = `${area.current.scrollHeight}px`;
  }, [text]);

  return (
    <figure className="relative shadow-lg rounded">
      <div className="absolute right-0 p-1">
        <CopyIcon text={text} />
      </div>
      <div className="myst">
        <label>
          <span className="sr-only">Edit the MyST text</span>
          <textarea
            ref={area}
            value={text}
            className="block p-6 shadow-inner resize-none w-full font-mono bg-slate-50 dark:bg-slate-800 outline-none"
            onChange={(e) => setText(e.target.value)}
          ></textarea>
        </label>
      </div>
      {/* The `exclude-from-outline` class is excluded from the document outline */}
      <div className="exclude-from-outline relative min-h-1 pt-[50px] px-6 pb-6 dark:bg-slate-900">
        <div className="absolute cursor-pointer top-0 left-0 border dark:border-slate-600">
          {['DEMO', 'AST', 'LaTeX'].map((show) => (
            <button
              key={show}
              className={classnames('px-2', {
                'bg-white hover:bg-slate-200 dark:bg-slate-500 dark:hover:bg-slate-700':
                  previewType !== show,
                'bg-blue-800 text-white': previewType === show,
              })}
              title={`Show the ${show}`}
              aria-label={`Show the ${show}`}
              aria-pressed={previewType === show ? 'true' : 'false'}
              onClick={() => setPreviewType(show)}
            >
              {show}
            </button>
          ))}
        </div>
        {previewType === 'DEMO' && (
          <ReferencesProvider references={references} frontmatter={frontmatter}>
            {content}
          </ReferencesProvider>
        )}
        {previewType === 'AST' && <CodeBlock lang="yaml" value={mdastYaml} showCopy={false} />}
        {previewType === 'LaTeX' && <CodeBlock lang="latex" value={tex} showCopy={false} />}
      </div>
      {previewType === 'DEMO' && warnings.length > 0 && (
        <div>
          {warnings.map((m, i) => (
            <div
              key={i}
              className={classnames('p-1 shadow-inner text-white not-prose', {
                'bg-red-500 dark:bg-red-800': m.fatal === true,
                'bg-orange-500 dark:bg-orange-700': m.fatal === false,
                'bg-slate-500 dark:bg-slate-800': m.fatal === null,
              })}
            >
              {m.fatal === true && <ExclamationCircleIcon className="inline h-[1.3em] mr-1" />}
              {m.fatal === false && <ExclamationIcon className="inline h-[1.3em] mr-1" />}
              {m.fatal === null && <InformationCircleIcon className="inline h-[1.3em] mr-1" />}
              <code>{m.ruleId || m.source}</code>: {m.message}
            </div>
          ))}
        </div>
      )}
    </figure>
  );
}

const MystNodeRenderer: NodeRenderer = (node) => {
  return <MySTRenderer key={node.key} value={node.value} numbering={node.numbering} />;
};

const MYST_RENDERERS = {
  myst: MystNodeRenderer,
};

export default MYST_RENDERERS;
