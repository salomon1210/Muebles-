import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// Cambiá esto por tu dominio definitivo cuando lo tengas (afecta sitemap y SEO).
const SITE = process.env.PUBLIC_SITE_URL || 'https://milano-home.vercel.app';

// https://astro.build/config
export default defineConfig({
  site: SITE,
  output: 'static',
  integrations: [preact(), tailwind(), sitemap()],
});
