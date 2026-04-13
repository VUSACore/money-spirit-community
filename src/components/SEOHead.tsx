import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: string;
}

const SEOHead = ({ title, description, ogTitle, ogDescription, ogType, ogImage }: SEOHeadProps) => (
  <Helmet>
    <title>{title}</title>
    {description && <meta name="description" content={description} />}
    {ogTitle && <meta property="og:title" content={ogTitle} />}
    {(ogDescription || description) && <meta property="og:description" content={ogDescription || description} />}
    {ogType && <meta property="og:type" content={ogType} />}
    {ogImage && <meta property="og:image" content={ogImage} />}
  </Helmet>
);

export default SEOHead;
