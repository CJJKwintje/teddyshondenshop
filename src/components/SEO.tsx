import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  type?: 'website' | 'product' | 'article';
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
  // Product-specific props
  product?: {
    price?: number;
    compareAtPrice?: number;
    isOnSale?: boolean;
    availability?: 'in stock' | 'out of stock';
    brand?: string;
  };
}

export default function SEO({
  title,
  description,
  canonical,
  type = 'website',
  image,
  imageAlt,
  noindex = false,
  product,
}: SEOProps) {
  const siteTitle = "Teddy's hondenshop";
  const fullTitle = title === siteTitle ? title : `${title} | ${siteTitle}`;
  
  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex ? (
        <meta name="robots" content="noindex,follow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      {imageAlt && <meta property="og:image:alt" content={imageAlt} />}
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {imageAlt && <meta name="twitter:image:alt" content={imageAlt} />}
      <meta name="twitter:site" content="@teddyshondenshop" />

      {/* Product-specific meta tags */}
      {type === 'product' && product && (
        <>
          {product.isOnSale && product.price && (
            <>
              <meta property="product:price:amount" content={product.price.toString()} />
              <meta property="product:price:currency" content="EUR" />
              <meta property="product:sale_price:amount" content={product.price.toString()} />
              <meta property="product:sale_price:currency" content="EUR" />
              {product.compareAtPrice && (
                <>
                  <meta property="product:original_price:amount" content={product.compareAtPrice.toString()} />
                  <meta property="product:original_price:currency" content="EUR" />
                </>
              )}
            </>
          )}
          {product.availability && (
            <meta property="product:availability" content={product.availability} />
          )}
          <meta property="product:condition" content="new" />
          {product.brand && (
            <meta property="product:brand" content={product.brand} />
          )}
        </>
      )}
    </Helmet>
  );
}