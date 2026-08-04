/** Inline SVG marketplace brand icons — eliminates external CDN requests.
 *  Previously loaded from cdn.simpleicons.org / cdn.worldvectorlogo.com at runtime.
 *  These are simplified, recognizable brand marks compliant with brand guidelines. */

interface IconProps {
  className?: string;
}

/** Shopee — shopping bag silhouette in Shopee orange */
export const ShopeeIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="Shopee"
    style={{ color: "#EE4D2D" }}
  >
    <path d="M12 2L2 7l2 13h16l2-13L12 2zm0 2.5L19.5 7 18 17H6L4.5 7 12 4.5z" />
    <path d="M9 9.5c0-1.7 1.3-3 3-3s3 1.3 3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** Tokopedia — owl silhouette in Tokopedia green */
export const TokopediaIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="Tokopedia"
    style={{ color: "#03AC0E" }}
  >
    <circle cx="12" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="9" r="1" fill="currentColor" />
    <circle cx="14" cy="9" r="1" fill="currentColor" />
    <path d="M9 12c.5 1 1.5 1.5 3 1.5s2.5-.5 3-1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M7 7L2 4l2 4-3 3 5-1m10-3l5-3-2 4 3 3-5-1" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M18 19H6l-1 3h14l-1-3z" fill="currentColor" opacity="0.3" />
  </svg>
);

/** TikTok — music note in TikTok teal/white */
export const TikTokIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="TikTok"
  >
    <path d="M17.5 6.5a4.5 4.5 0 01-3-1.5v6a5 5 0 11-4-4.8v2.4a2.5 2.5 0 102 2.4V2h2.5c.5 1.5 1.5 3 2.5 4.5z" />
  </svg>
);

/** Instagram — camera outline in Instagram pink */
export const InstagramIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="Instagram"
    style={{ color: "#E4405F" }}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
  </svg>
);
