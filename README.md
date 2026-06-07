# MODUS
**Taste intelligence for the age of agents.**  
modus.gallery — Founded Montreal, 2026

---

## What This Is

MODUS is a taste intelligence publication covering design, architecture, fine art, wellness, luxury travel, and fashion. Every page is built to be readable by both human visitors and AI agents (Claude, ChatGPT, Perplexity, etc.).

## Stack

- Pure HTML / CSS / vanilla JS — no framework, no build step
- Vercel for hosting (static)
- Google Fonts CDN (Cormorant Garamond)
- Schema.org JSON-LD on every page for agent readability
- `llms.txt` at root for AI crawler briefing

## For Claude Code

**Read `CLAUDE.md` first.** It contains the complete design system, component library, JSON-LD templates, Midjourney prompts, editorial voice guide, and department briefs. Everything you need to build or update any page is in that file.

## Deployment

Connect this repo to Vercel. No build command. Vercel serves static files from root.

Set custom domain `modus.gallery` in Vercel dashboard.  
GoDaddy DNS: CNAME `@` → `cname.vercel-dns.com`

## Publisher

Stanford Emporium Inc.  
Daniel Stanford, Founder & Editor-in-Chief  
editorial@modus.gallery
