// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/server';

// https://astro.build/config
export default defineConfig({
  site: 'https://sudx.xyz',
  output: 'server',
  adapter: vercel(),
  integrations: [sitemap()],
});
