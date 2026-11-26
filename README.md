# CSDI client design preview

A static, responsive website built from the supplied **CSDI Website Design V2 (26 November 2026)**. This preview is for client review of the content and design before creating the WordPress theme.

## Run locally

Requires Node.js 22 or later. There are no third-party dependencies.

```sh
npm run dev
```

Open http://localhost:4173. Source changes rebuild automatically; refresh the browser to see them.

```sh
npm run check
npm run build
npm run preview
```

## Deploy to Vercel

Import `JubaerHossenSiam/CSDI` in Vercel. Use the repository root as the Root Directory. The included `vercel.json` sets:

- Framework Preset: Other
- Build Command: `npm run build`
- Output Directory: `dist`
- No environment variables or backend services required

The site is a collection of HTML pages, so page links and direct URLs work without an SPA fallback. Vercel serves `404.html` for missing pages. Search-engine indexing is discouraged using robots.txt, page metadata, and response headers. This is not access protection; use Vercel deployment protection if the preview must be private.

## Files

- `src/pages/`: editable HTML pages preserving the supplied design.
- `public/`: Manrope fonts, shared scripts and CSS, and the supplied V2 image pack as optimized WebP files under `images/v2/`.
- `scripts/`: dependency-free build, local server and link/asset checks.
- `CSDI-Website-v2/`: original supplied website and canvas files, preserved unchanged as the design reference.
- `dist/`: generated deployable website (not committed).

## Review pages

Home, About, Courses, Caregiving, Japanese, English, ComputerSkills, Admission, Apply, ApplyCaregiving, ApplyJapanese, ApplyEnglish, ApplyComputerSkills, News, NewsArticle, Contact, Terms, Privacy, Refund, NotFound, Student and StudentInvalid. Use the corresponding `.html` URL; the homepage is `/`.

The student verification pages are visual samples from the design. They do not verify a student against a database or require a QR code.

## Preview interactions

The mobile menu supports mouse, touch and keyboard; course FAQs expand; gallery filters and a keyboard-accessible lightbox work. Each news card opens its own summary preview. Only the first story has full article copy in the supplied design; other stories clearly show the supplied summary awaiting final content. The gallery shows six items at a time and offers Load More only when additional items match the selected filter. It displays two supplied video covers as stills while the footage is pending. The staff, testimonial, and student ID portraits are illustrative samples.

Application and contact forms validate required fields and display a local preview confirmation. Switching an application course loads its matching form and preserves common details in memory. **No forms send, store, email or persist personal details.** Refreshing clears the form state. There is no production admission, email, payment or verification backend.

## Before the WordPress build

Confirm the supplied placeholder fees (`BDT 00,000`), dates, durations, statistics, student samples, testimonials, images, policies and contact details with the client. Reuse the approved page structure and visual styling when building the theme; connect forms, content management, news, media and student verification to the final WordPress implementation then.
