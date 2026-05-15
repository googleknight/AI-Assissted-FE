/**
 * PRACTICE 06 — Images, CLS, and load perf
 * Difficulty: Easy
 * Time target: 2 minutes
 *
 * Task: Lighthouse reports CLS 0.45 (bad) and slow LCP. Find every image-related
 * issue and fix.
 */

export function ProductCard({ product }) {
  return (
    <article className="card">
      <img src={product.heroImage} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="gallery">
        {product.gallery.map((src) => (
          <img key={src} src={src} alt="" />
        ))}
      </div>
      <img className="logo" src="/brand-logo.svg" />
    </article>
  );
}

/**
 * QUESTIONS:
 * 1. Why is CLS bad? (Images without dimensions reflow as they load.)
 * 2. Why is LCP slow? (No preload on hero, no priority hints, no responsive sizes.)
 * 3. Fix the hero:
 *    - width / height attributes
 *    - `loading="eager"` + `fetchpriority="high"` for above-fold
 *    - `<link rel="preload" as="image">` in head
 * 4. Fix the gallery:
 *    - `loading="lazy"` for below-fold
 *    - responsive sources via srcset / sizes or <picture>
 * 5. Fix the logo:
 *    - empty alt is OK only if decorative; if it conveys info, add alt
 *    - SVG inline can be faster than <img> for tiny icons (eliminates request)
 * 6. In Next.js, what does `<Image>` do for you automatically?
 */
