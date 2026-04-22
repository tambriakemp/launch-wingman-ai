import { Helmet } from "react-helmet-async";

const SITE_URL = "https://launchely.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface SEOProps {
  title: string;
  description: string;
  /** Path only (e.g. "/how-it-works") — will be combined with the site URL. */
  path?: string;
  image?: string;
  type?: "website" | "article";
  /** Additional JSON-LD blocks (already-built objects). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Optional breadcrumbs: ordered list of {name, path}. Auto-builds BreadcrumbList JSON-LD. */
  breadcrumbs?: { name: string; path: string }[];
  noIndex?: boolean;
}

export const SEO = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  jsonLd,
  breadcrumbs,
  noIndex = false,
}: SEOProps) => {
  const url = `${SITE_URL}${path}`;
  const absoluteImage = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  const ldBlocks: Record<string, unknown>[] = [];
  if (jsonLd) {
    Array.isArray(jsonLd) ? ldBlocks.push(...jsonLd) : ldBlocks.push(jsonLd);
  }
  if (breadcrumbs && breadcrumbs.length > 0) {
    ldBlocks.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
        item: `${SITE_URL}${b.path}`,
      })),
    });
  }

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={absoluteImage} />
      <meta property="og:site_name" content="Launchely" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@launchely" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />

      {ldBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
