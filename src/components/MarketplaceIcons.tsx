/** Inline SVG marketplace brand icons — eliminates external CDN requests.
 *  Previously loaded from cdn.simpleicons.org / cdn.worldvectorlogo.com at runtime.
 *  These are simplified, recognizable brand marks compliant with brand guidelines. */

interface IconProps {
  className?: string;
}

/** Shopee — official Shopee "S" shopping-bag brand mark in Shopee orange */
export const ShopeeIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="Shopee"
    style={{ color: "#EE4D2D" }}
  >
    <path d="M15.9414 17.9633c.229-1.879-.981-3.077-4.1758-4.0969-1.548-.528-2.277-1.22-2.26-2.1719.065-1.056 1.048-1.825 2.352-1.85a5.2898 5.2898 0 0 1 2.8838.89c.116.072.197.06.263-.039.09-.145.315-.494.39-.62.051-.081.061-.187-.068-.281-.185-.1369-.704-.4149-.983-.5319a6.4697 6.4697 0 0 0-2.5118-.514c-1.909.008-3.4129 1.215-3.5389 2.826-.082 1.1629.494 2.1078 1.73 2.8278.262.152 1.6799.716 2.2438.892 1.774.552 2.695 1.5419 2.478 2.6969-.197 1.047-1.299 1.7239-2.818 1.7439-1.2039-.046-2.2878-.537-3.1278-1.19l-.141-.11c-.104-.08-.218-.075-.287.03-.05.077-.376.547-.458.67-.077.108-.035.168.045.234.35.293.817.613 1.134.775a6.7097 6.7097 0 0 0 2.8289.727 4.9048 4.9048 0 0 0 2.0759-.354c1.095-.465 1.8029-1.394 1.9449-2.554zM11.9986 1.4009c-2.068 0-3.7539 1.95-3.8329 4.3899h7.6657c-.08-2.44-1.765-4.3899-3.8328-4.3899zm7.8516 22.5981-.08.001-15.7843-.002c-1.074-.04-1.863-.91-1.971-1.991l-.01-.195L1.298 6.2858a.459.459 0 0 1 .45-.494h4.9748C6.8448 2.568 9.1607 0 11.9996 0c2.8388 0 5.1537 2.5689 5.2757 5.7898h4.9678a.459.459 0 0 1 .458.483l-.773 15.5883-.007.131c-.094 1.094-.979 1.9769-2.0709 2.0059z" />
  </svg>
);

/** Tokopedia — owl mascot silhouette in Tokopedia green */
export const TokopediaIcon = ({ className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-label="Tokopedia"
    style={{ color: "#03AC0E" }}
  >
    {/* Owl body + head with ear tufts */}
    <path d="M12 2.5 9 6H7.5L6.5 8C5.5 9.5 5.5 11 5.5 13v7h13v-7c0-2 0-3.5-1-5L16.5 6H15L12 2.5z" />
    {/* Eyes */}
    <circle cx="9.5" cy="10" r="2.2" fill="#fff" />
    <circle cx="14.5" cy="10" r="2.2" fill="#fff" />
    {/* Pupils */}
    <circle cx="9.8" cy="10" r="1.1" fill="currentColor" />
    <circle cx="14.2" cy="10" r="1.1" fill="currentColor" />
    {/* Beak */}
    <path d="M11.5 12.5 12 14l.5-1.5z" fill="#FFC200" />
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
