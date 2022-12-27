import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@200;300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body className="min-h-screen bg-gradient-to-b from-[#12082a] via-[#1e0e46] to-[#12082a]">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
