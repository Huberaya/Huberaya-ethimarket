import { useEffect } from 'react';

type SEOHeadProps = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: object;
};

export default function SEOHead({
  title = 'EthiMarket - Marketplace B2B Équitable & Traçable Afrique-Europe',
  description = 'Achetez en direct auprès de producteurs africains vérifiés. Cacao, café, épices, fruits secs avec traçabilité blockchain et score éthique transparent.',
  image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200',
  url = window.location.href,
  type = 'website',
  jsonLd,
}: SEOHeadProps) {
  useEffect(() => {
    // Document title
    document.title = title.includes('EthiMarket') ? title : `${title} | EthiMarket`;

    // Helper for meta tags
    const setMetaTag = (selector: string, attr: string, value: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (selector.startsWith('meta[name=')) {
          element.setAttribute('name', selector.replace("meta[name='", '').replace("']", ''));
        } else if (selector.startsWith('meta[property=')) {
          element.setAttribute('property', selector.replace("meta[property='", '').replace("']", ''));
        }
        document.head.appendChild(element);
      }
      element.setAttribute(attr, value);
    };

    // Standard Meta
    setMetaTag("meta[name='description']", 'content', description);

    // Open Graph
    setMetaTag("meta[property='og:title']", 'content', title);
    setMetaTag("meta[property='og:description']", 'content', description);
    setMetaTag("meta[property='og:image']", 'content', image);
    setMetaTag("meta[property='og:url']", 'content', url);
    setMetaTag("meta[property='og:type']", 'content', type);

    // Twitter
    setMetaTag("meta[name='twitter:card']", 'content', 'summary_large_image');
    setMetaTag("meta[name='twitter:title']", 'content', title);
    setMetaTag("meta[name='twitter:description']", 'content', description);
    setMetaTag("meta[name='twitter:image']", 'content', image);

    // JSON-LD Structured Data
    if (jsonLd) {
      let script = document.querySelector("script[type='application/ld+json']");
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, image, url, type, jsonLd]);

  return null;
}
