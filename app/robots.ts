import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/admin/*',
        '/api/*',
        '/customer/*',
        '/partner/dashboard',
        '/partner/verification',
      ],
    },
    sitemap: 'https://tizl.in/sitemap.xml',
  };
}
