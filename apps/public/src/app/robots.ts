import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// The admin panel is a separate site and is not served from here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
