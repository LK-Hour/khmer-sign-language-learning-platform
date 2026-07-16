import type { MetadataRoute } from "next";
import { DISALLOWED_ROBOTS_PATHS, SITE_URL } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOWED_ROBOTS_PATHS,
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
