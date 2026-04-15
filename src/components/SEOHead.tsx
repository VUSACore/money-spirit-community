import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
}

const DEFAULT_OG_IMAGE = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/195feafb-17df-43b8-bf18-46104fe5ceba/id-preview-4999e700--cca58df7-e68c-4011-b3eb-031c9d66e91f.lovable.app-1775009916855.png";

const SEOHead = ({ title, description, ogTitle, ogDescription, ogType, ogImage, canonical, noindex }: SEOHeadProps) => (
  <Helmet>
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {noindex && <meta name="robots" content="noindex, nofollow" />}
    {canonical && <link rel="canonical" href={canonical} />}
    <meta property="og:title" content={ogTitle || title} />
    {(ogDescription || description) && <meta property="og:description" content={ogDescription || description} />}
    <meta property="og:type" content={ogType || "website"} />
    <meta property="og:image" content={ogImage || DEFAULT_OG_IMAGE} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={ogTitle || title} />
    {(ogDescription || description) && <meta name="twitter:description" content={ogDescription || description} />}
    <meta name="twitter:image" content={ogImage || DEFAULT_OG_IMAGE} />
  </Helmet>
);

export default SEOHead;
