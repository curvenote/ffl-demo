import { KatexCSS } from '@curvenote/site';
import { Theme, ThemeProvider } from '@curvenote/ui-providers';
import type { LinksFunction } from '@remix-run/node';
import { MySTRenderer } from '../components/myst';

const example = `---
# Math frontmatter:
math:
  # Note the 'single quotes'
  '\\dobs':
     macro: '\\mathbf{d}_\\text{obs}'
     color: red
  '\\dpred': '\\mathbf{d}_\\text{pred}\\left( #1 \\right)'
  '\\mref': '\\mathbf{m}_\\text{ref}'
---

The residual is the predicted data for the model, $\\dpred{m}$, minus the observed data, $\\dobs$. You can also calculate the predicted data for the reference model $\\dpred{\\mref}$.

$$
\\dobs
$$ (my-equation)

In [](#my-equation) you can see referenced equation as well!
`;

export const links: LinksFunction = () => [KatexCSS];

export default function Index() {
  return (
    <article className="prose sm:px-10 xl:px-[330px] xl:mx-auto xl:max-w-[1475px] prose-stone mt-10">
      <h1>Formula Formmatting Language</h1>
      <ThemeProvider theme={Theme.light}>
        <MySTRenderer value={example} numbering={{}} />
      </ThemeProvider>
    </article>
  );
}
