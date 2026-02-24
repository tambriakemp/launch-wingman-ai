

## Generate OG Image and Fix Social Handles

### 1. Generate OG Image (1200x630px)
Use the Lovable AI image generation API to create a professional OG image for social sharing. The image will follow Launchely's brand identity:
- **Dark background** matching the primary color (near-black, warm tone)
- **Gold accent** elements matching the brand accent color
- **Launchely logo and tagline**: "Launch Planning for Coaches and Marketers"
- **Clean SaaS aesthetic** with the Plus Jakarta Sans font feel
- Dimensions: 1200x630px (standard OG image size)

The generated image will be saved to `public/og-image.png`.

### 2. Fix Social Handles in `index.html`
Update the Twitter/X handle from `@laaboratory` to `@launchely`:
```
<meta name="twitter:site" content="@launchely" />
```

### 3. Fix Social Links in `LandingFooter.tsx`
Update all three social media links from mixed handles to `@launchely`:
- Instagram: `https://instagram.com/launchely` (already correct)
- Facebook: `https://facebook.com/launchely` (already correct)
- TikTok: `https://tiktok.com/@launchely` (already correct)

After reviewing the footer, the social links are already pointing to `launchely`. The only fix needed is the Twitter meta tag in `index.html`.

### Files to modify
1. `public/og-image.png` -- new file (AI-generated image)
2. `index.html` -- update Twitter handle meta tag

### Technical Details
- The OG image will be generated using the Lovable AI image generation model (`google/gemini-2.5-flash-image`)
- The image will be saved as a PNG in the `public/` directory so it's served at `/og-image.png`
- The existing `og:image` and `twitter:image` meta tags already point to `https://launchely.com/og-image.png`, which will resolve correctly once hosted
