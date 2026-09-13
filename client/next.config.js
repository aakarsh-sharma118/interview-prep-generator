/**
 * Next.js Configuration with Security Headers & Optimizations
 * Author: Aakarsh Sharma
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // ── Security Headers ────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https:; connect-src 'self' http://localhost:5000 http://localhost:3000 https:; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },

  // ── Webpack Compiler Hooks ─────────────────────────────────────────────────
  webpack(config, { dev, isServer }) {
    if (dev && !isServer) {
      let hasOpened = false;
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.done.tap('AutoOpenBrowserPlugin', () => {
            if (!hasOpened && process.env.NODE_ENV !== 'production') {
              hasOpened = true;
              const targetUrl = 'http://localhost:3000';
              const openCommand =
                process.platform === 'win32'
                  ? `start "" "${targetUrl}"`
                  : process.platform === 'darwin'
                  ? `open "${targetUrl}"`
                  : `xdg-open "${targetUrl}"`;

              import('child_process').then(({ exec }) => {
                exec(openCommand);
              });
            }
          });
        },
      });
    }
    return config;
  },
};

export default nextConfig;
