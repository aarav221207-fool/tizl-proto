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
        '/book', 
        '/customer/*', 
        '/partner/*', 
        '/login', 
        '/signup', 
        '/forgot-password', 
        '/reset-password'
      ],
    },
    sitemap: 'https://tizl.in/sitemap.xml',
  };
}
