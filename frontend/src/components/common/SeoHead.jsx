import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Reusable, production-grade SEO Head manager.
 * Injects canonical links, standardized Open Graph, Twitter Cards, robots directives,
 * and Schema.org JSON-LD structured data into document <head>.
 */
export function SeoHead({
  seo,
  title,
  description,
  canonicalUrl,
  robots,
  openGraph,
  twitter,
  jsonLd,
  children
}) {
  const defaultBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://researchfactors.com';

  // 1. Resolve Fields (Support either pre-resolved `seo` prop or individual props)
  const resolvedTitle = seo?.title || title || 'Research Factors — Peer-Reviewed Insights & Empirical Research';
  const resolvedDescription = seo?.description || description || 'Explore verified research, empirical benchmarks, and interdisciplinary analysis.';
  const resolvedCanonical = seo?.canonicalUrl || canonicalUrl || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '');
  const resolvedRobots = seo?.robots || robots || 'index, follow';

  // Open Graph
  const ogTitle = seo?.openGraph?.title || openGraph?.title || resolvedTitle;
  const ogDescription = seo?.openGraph?.description || openGraph?.description || resolvedDescription;
  const ogUrl = seo?.openGraph?.url || openGraph?.url || resolvedCanonical;
  const ogType = seo?.openGraph?.type || openGraph?.type || 'website';
  const ogSiteName = seo?.openGraph?.siteName || openGraph?.siteName || 'Research Factors';
  const ogImage = seo?.openGraph?.image || openGraph?.image || `${defaultBaseUrl}/logo.png`;

  // Twitter
  const twitterCard = seo?.twitter?.card || twitter?.card || 'summary_large_image';
  const twitterTitle = seo?.twitter?.title || twitter?.title || ogTitle;
  const twitterDescription = seo?.twitter?.description || twitter?.description || ogDescription;
  const twitterImage = seo?.twitter?.image || twitter?.image || ogImage;

  // JSON-LD
  const resolvedJsonLd = seo?.schema?.jsonLd || jsonLd || null;

  return (
    <Helmet>
      {/* Primary HTML Meta Tags */}
      <title>{resolvedTitle}</title>
      {resolvedDescription && <meta name="description" content={resolvedDescription} />}
      {resolvedRobots && <meta name="robots" content={resolvedRobots} />}
      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      {ogTitle && <meta property="og:title" content={ogTitle} />}
      {ogDescription && <meta property="og:description" content={ogDescription} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}
      {ogSiteName && <meta property="og:site_name" content={ogSiteName} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter / X */}
      <meta name="twitter:card" content={twitterCard} />
      {twitterTitle && <meta name="twitter:title" content={twitterTitle} />}
      {twitterDescription && <meta name="twitter:description" content={twitterDescription} />}
      {twitterImage && <meta name="twitter:image" content={twitterImage} />}

      {/* Structured Data (Schema.org JSON-LD) */}
      {resolvedJsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(resolvedJsonLd)}
        </script>
      )}

      {children}
    </Helmet>
  );
}
