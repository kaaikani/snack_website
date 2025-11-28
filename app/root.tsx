// app/root.tsx
import { cssBundleHref } from '@remix-run/css-bundle';
import {
  isRouteErrorResponse,
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  MetaFunction,
} from '@remix-run/react';
import stylesheet from './tailwind.css';
import { Header } from './components/header/Header';
import {
  DataFunctionArgs,
  json,
  LinksFunction,
  LoaderFunctionArgs,
  redirect,
} from '@remix-run/server-runtime';
import { getCollections } from '~/providers/collections/collections';
import { activeChannel } from '~/providers/channel/channel';
import { APP_META_DESCRIPTION, APP_META_TITLE } from '~/constants';
import { useEffect, useState } from 'react';
import { CartTray } from '~/components/cart/CartTray';
import { getActiveCustomer } from '~/providers/customer/customer';
import Footer from '~/components/footer/Footer';
import { useActiveOrder } from '~/utils/use-active-order';
import { useChangeLanguage } from 'remix-i18next';
import { useTranslation } from 'react-i18next';
import { getI18NextServer } from '~/i18next.server';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useLocation, useSearchParams } from '@remix-run/react';
import { trackPageView, trackSignIn } from '~/utils/facebook-pixel';
import { OrderDetailFragment } from './generated/graphql';

const devMode =
  typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

export const meta: MetaFunction = () => {
  return [{ title: APP_META_TITLE }, { description: APP_META_DESCRIPTION }];
};

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export type RootLoaderData = {
  activeCustomer: Awaited<ReturnType<typeof getActiveCustomer>>;
  activeChannel: Awaited<ReturnType<typeof activeChannel>>;
  collections: Awaited<ReturnType<typeof getCollections>>;
  locale: string;
  ENV: {
    GOOGLE_CLIENT_ID: string;
  };
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // const publicPaths = ['/', '/sign-in', '/sign-up', '/forgot-password'];
  // const isPublic = publicPaths.includes(pathname);

  const activeCustomer = await getActiveCustomer({ request });

  // if (!activeCustomer.activeCustomer?.id && !isPublic) {
  //   return redirect('/sign-in');
  // }

  const collections = await getCollections(request, { take: 20 });
  const topLevelCollections = collections.filter(
    (collection) => collection.parent?.name === '__root_collection__',
  );

  const locale = await getI18NextServer().then((i18next) =>
    i18next.getLocale(request),
  );

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('Missing GOOGLE_CLIENT_ID in environment');
  }

  return json<RootLoaderData>(
    {
      activeCustomer,
      activeChannel: await activeChannel({ request }),
      collections: topLevelCollections,
      locale,
      ENV: {
        GOOGLE_CLIENT_ID,
      },
    },
    { headers: activeCustomer._headers },
  );
}

export default function App() {
  const loaderData = useLoaderData<RootLoaderData>();
  const { collections, activeCustomer, locale, ENV } = loaderData;
  const { i18n } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const {
    activeOrderFetcher,
    activeOrder,
    adjustOrderLine,
    removeItem,
    refresh,
  } = useActiveOrder();

  const [open, setOpen] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(
    !!activeCustomer.activeCustomer?.id,
  );
  const [isClient, setIsClient] = useState(false);
  const [hasTrackedLogin, setHasTrackedLogin] = useState(false);

  useEffect(() => {
    setIsSignedIn(!!loaderData.activeCustomer.activeCustomer?.id);
  }, [loaderData.activeCustomer.activeCustomer?.id]);

  useEffect(() => {
    refresh();
  }, [loaderData]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Track sign in when loginSuccess parameter is present
  useEffect(() => {
    if (
      isClient &&
      searchParams.get('loginSuccess') === 'true' &&
      !hasTrackedLogin
    ) {
      trackSignIn({ method: 'google' });
      setHasTrackedLogin(true);
      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('loginSuccess');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [isClient, searchParams, hasTrackedLogin]);

  // Track page views for Facebook Pixel with page name
  useEffect(() => {
    if (
      isClient &&
      typeof window !== 'undefined' &&
      typeof window.fbq === 'function'
    ) {
      trackPageView();
    }
  }, [location.pathname, isClient]);

  useChangeLanguage(locale);

  // Show loading only if we don't have the Google Client ID
  if (!ENV.GOOGLE_CLIENT_ID) {
    return (
      <html lang={locale} dir={i18n.dir()} id="app">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <link rel="icon" href="/favicon.ico" type="image/png" />
          <Meta />
          <Links />
          {/* Google tag (gtag.js) */}
          <script
            async
            src="https://www.googletagmanager.com/gtag/js?id=AW-17637781771"
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-17637781771');
            `,
            }}
          />
          {/* Facebook Meta Pixel */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '864256719277462');
              fbq('track', 'PageView');
            `,
            }}
          />
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src="https://www.facebook.com/tr?id=864256719277462&ev=PageView&noscript=1"
              alt=""
            />
          </noscript>
        </head>
        <body>
          <div>Loading...</div>
        </body>
      </html>
    );
  }

  const loyaltyPoints =
    loaderData.activeCustomer?.activeCustomer?.customFields
      ?.loyaltyPointsAvailable ?? null;

  return (
    <html lang={locale} dir={i18n.dir()} id="app">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href="/favicon.ico" type="image/png" />
        <Meta />
        <Links />
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-H98QJ8PYLM"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-H98QJ8PYLM');
            `,
          }}
        />
        {/* Facebook Meta Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '864256719277462');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=864256719277462&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* 👇 this must be before the body to inject early */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)};`,
          }}
        />
      </head>
      <body className="bg-[#ffedc7]">
        <GoogleOAuthProvider clientId={ENV.GOOGLE_CLIENT_ID}>
          {/* <Header collections={collections} /> */}
          <Header
            onCartIconClick={() => setOpen(!open)}
            cartQuantity={activeOrder?.totalQuantity ?? 0}
            collections={collections}
            isCartOpen={open}
            loyaltyPoints={loyaltyPoints}
            isSignedIn={isSignedIn}
            alwaysVisible={true}
          />
          <main className="relative">
            <Outlet
              context={{
                activeOrderFetcher,
                activeOrder,
                adjustOrderLine,
                removeItem,
                isSignedIn,
              }}
            />
          </main>
          {isSignedIn && (
            <CartTray
              open={open}
              onClose={setOpen}
              activeOrder={
                activeOrder as OrderDetailFragment | null | undefined
              }
              adjustOrderLine={adjustOrderLine}
              removeItem={removeItem}
            />
          )}
          <Footer />
        </GoogleOAuthProvider>
        <ScrollRestoration />
        <Scripts />
        {devMode && <LiveReload />}
      </body>
    </html>
  );
}

// Error Boundaries
function DefaultSparseErrorPage({
  tagline,
  headline,
  description,
}: {
  tagline: string;
  headline: string;
  description: string;
}) {
  return (
    <html lang="en" id="app">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-H98QJ8PYLM"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-H98QJ8PYLM');
            `,
          }}
        />
        {/* Facebook Meta Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '864256719277462');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=864256719277462&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body>
        <main className="flex flex-col items-center px-4 py-16 sm:py-32 text-center">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {tagline}
          </span>
          <h1 className="mt-2 font-bold text-gray-900 tracking-tight text-4xl sm:text-5xl">
            {headline}
          </h1>
          <p className="mt-4 text-base text-gray-500 max-w-full break-words">
            {description}
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="text-base font-medium text-primary-600 hover:text-primary-500 inline-flex gap-2"
            >
              Go back home
            </Link>
          </div>
        </main>
        <ScrollRestoration />
        <Scripts />
        {devMode && <LiveReload />}
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  let tagline = 'Oopsy daisy';
  let headline = 'Unexpected error';
  let description = "We couldn't handle your request. Please try again later.";

  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    tagline = `${error.status} error`;
    headline = error.statusText;
    description = error.data;
  }

  return (
    <DefaultSparseErrorPage
      tagline={tagline}
      headline={headline}
      description={description}
    />
  );
}

export function CatchBoundary() {
  return ErrorBoundary();
}
