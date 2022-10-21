import type { LinksFunction, MetaFunction } from '@remix-run/node';
import tailwind from '~/styles/app.css';
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return {
    charset: 'utf-8',
    title: 'Formula Formatting Language',
    viewport: 'width=device-width,initial-scale=1',
  };
};

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: tailwind }];
};

export function Document({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {title && <title>{title}</title>}
        <Meta />
        <Links />
      </head>
      <body className="m-0 transition-colors duration-500 bg-white dark:bg-stone-900">
        {children}
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Document title={'Formula Formatting Language'}>
      <Outlet />
    </Document>
  );
}
