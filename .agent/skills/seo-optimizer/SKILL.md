---
name: seo-optimizer
description: Search Engine Optimization specialist for content strategy, technical SEO, keyword research, and ranking improvements. Use this skill whenever optimizing website content, writing meta tags, planning content, auditing for technical SEO issues, implementing schema markup, improving Core Web Vitals, or when asked anything related to search engine visibility, organic traffic, or Google rankings.
---

# SEO Optimizer

## When to Use This Skill
- Writing or optimizing page titles and meta descriptions
- Auditing pages for SEO issues
- Planning content strategy for organic traffic
- Implementing schema markup (structured data)
- Improving Core Web Vitals and page speed
- Building internal linking strategy
- Keyword research and mapping

## SEO Fundamentals

### 1. Keyword Research & Strategy

**Search Intent Types:**
- **Informational:** "how does AI therapy work" → blog/educational content
- **Navigational:** "AI therapist login" → homepage/login page
- **Commercial:** "best AI therapy app" → landing/comparison page
- **Transactional:** "sign up AI therapist" → pricing/signup page

**Keyword Research Process:**
1. Identify seed keywords from business objectives
2. Expand using tools (Google Keyword Planner, Ahrefs, SEMrush)
3. Analyze search volume vs keyword difficulty
4. Group by topic clusters
5. Map to specific pages
6. Prioritize by potential ROI

**Content Optimization Formula:**
- Primary keyword: 1-2% density (natural, not forced)
- Include in: Title tag, H1, first paragraph, URL slug, meta description
- Use semantic variations and related terms throughout

### 2. On-Page SEO

**Title Tag:**
```html
<!-- ✅ Good: descriptive, keyword near start, under 60 chars -->
<title>AI Therapy Sessions | Talk to Your Personal AI Therapist</title>

<!-- ❌ Bad: too long, keyword stuffing -->
<title>AI Therapy AI Therapist Online Therapy AI Mental Health AI Therapy Sessions Online</title>
```

**Meta Description:**
```html
<!-- ✅ Good: compelling, 150-160 chars, contains keyword + CTA -->
<meta name="description" content="Start AI therapy today. Talk to your personal AI therapist anytime — real sessions, real progress. Join 100,000+ users improving their mental health." />
```

**Header Structure:**
```html
<h1>One H1 per page — primary keyword here</h1>
  <h2>Section Headings — related keywords</h2>
    <h3>Subsections</h3>
```

**URL Structure:**
```
✅ Good: /blog/ai-therapy-benefits
✅ Good: /features/emotion-detection
❌ Bad: /page?id=123&ref=home
❌ Bad: /blog/2024/03/post-about-therapy-with-ai-and-emotions
```

**Image Optimization:**
```html
<img
  src="/images/ai-therapist-session-800w.webp"
  alt="AI therapist avatar during a therapy session showing empathic expression"
  width="800"
  height="600"
  loading="lazy"
/>
```

### 3. Technical SEO

**Core Web Vitals Targets:**
- **LCP (Largest Contentful Paint):** < 2.5s
- **FID/INP (Interaction):** < 100ms
- **CLS (Layout Shift):** < 0.1

**Next.js Technical SEO Checklist:**
```typescript
// next.config.ts — performance settings
const config = {
  images: { formats: ['image/avif', 'image/webp'] },
  compress: true,
};

// Every page must export metadata
export const metadata: Metadata = {
  title: 'Page Title | Brand',
  description: 'Page description 150-160 chars.',
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://yourdomain.com/page' },
  openGraph: {
    title: '...',
    description: '...',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
};
```

**Sitemap (Next.js App Router):**
```typescript
// app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://yourdomain.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://yourdomain.com/features', lastModified: new Date(), priority: 0.8 },
  ];
}
```

### 4. Schema Markup (Structured Data)

```typescript
// For the therapy app — WebApplication schema
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AI Therapist',
  description: 'AI-powered therapy sessions with real-time emotion analysis',
  applicationCategory: 'HealthApplication',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free trial available',
  },
};

// Inject in layout.tsx
<script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
```

## Pre-Publishing SEO Checklist

- [ ] Primary keyword in title tag (under 60 chars)
- [ ] Meta description (150-160 chars, compelling, includes keyword)
- [ ] Single H1 tag with primary keyword
- [ ] URL slug is clean and readable
- [ ] Images compressed (WebP) with descriptive alt text
- [ ] 3-5 internal links to relevant pages
- [ ] External links to authoritative sources (open in new tab)
- [ ] Schema markup implemented for the page type
- [ ] Canonical tag set correctly (no duplicate content)
- [ ] Mobile-friendly and responsive
- [ ] Page loads in < 3 seconds
- [ ] Open Graph + Twitter Card meta tags present
- [ ] No broken links

## Internal Linking Strategy

- Every page should receive at least 2-3 internal links from other pages
- Use descriptive anchor text (not "click here")
- Link related content: blog posts → feature pages → pricing
- High-authority pages should link to conversion pages
- Create topic cluster structure: pillar page → supporting content
