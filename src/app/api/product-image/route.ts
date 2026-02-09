import { NextRequest, NextResponse } from "next/server";

/**
 * Product Image Proxy — fetches REAL product images for suggested items.
 *
 * Strategy (in order of quality):
 *   1. Bing Images  → returns direct retailer image URLs (Amazon, IKEA, Wayfair…)
 *   2. Google Images → returns Google-cached thumbnails (encrypted-tbn)
 *
 * Why NOT Google Shopping?  Google Shopping HTML is JS-rendered;
 * a plain `fetch` returns 0 image URLs.
 */

// Simple in-memory cache to avoid repeated fetches for the same query
const imageCache = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export async function GET(req: NextRequest) {
    const query = req.nextUrl.searchParams.get("q");
    if (!query) {
        return NextResponse.json({ image_url: null }, { status: 400 });
    }

    // Check cache first
    const cached = imageCache.get(query);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        return NextResponse.json({ image_url: cached.url, source: "cache" });
    }

    let imageUrl: string | null = null;
    let source = "";

    // ── Strategy 1: Bing Images (best quality — returns DIRECT retailer URLs) ──
    try {
        const bingUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}&first=1`;
        const res = await fetch(bingUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html",
            },
            signal: AbortSignal.timeout(6000),
        });
        const html = await res.text();

        // Extract murl (original image URL from retailer like Amazon/IKEA)
        const murlMatches = html.match(/murl&quot;:&quot;(https?:\/\/[^&"]+)/g);
        if (murlMatches && murlMatches.length > 0) {
            // Get the first original product image URL
            const directUrl = murlMatches[0].replace("murl&quot;:&quot;", "");
            if (directUrl && directUrl.length > 10) {
                imageUrl = directUrl;
                source = "bing-direct";
                console.log(`[ProductImage] Bing direct: ${directUrl.substring(0, 100)}`);
            }
        }

        // Fallback: Bing thumbnail (always works, lower quality)
        if (!imageUrl) {
            const turlMatches = html.match(/turl&quot;:&quot;(https?:\/\/[^&"]+)/g);
            if (turlMatches && turlMatches.length > 0) {
                const thumbUrl = turlMatches[0].replace("turl&quot;:&quot;", "");
                if (thumbUrl && thumbUrl.length > 10) {
                    imageUrl = thumbUrl;
                    source = "bing-thumb";
                    console.log(`[ProductImage] Bing thumb: ${thumbUrl.substring(0, 100)}`);
                }
            }
        }
    } catch (e: any) {
        console.warn("[ProductImage] Bing failed:", e.message);
    }

    // ── Strategy 2: Google Images (fallback — encrypted thumbnails) ──
    if (!imageUrl) {
        try {
            const googleUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
            const res = await fetch(googleUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml",
                    "Accept-Language": "en-US,en;q=0.9",
                },
                signal: AbortSignal.timeout(6000),
            });
            const html = await res.text();

            // Google Images embeds encrypted thumbnails
            const tbnMatches = html.match(
                /https:\/\/encrypted-tbn\d+\.gstatic\.com\/images\?q=tbn:[^"'\s\\>]+/g
            );
            if (tbnMatches && tbnMatches.length > 0) {
                imageUrl = tbnMatches[0].replace(/\\u003d/g, "=").replace(/&amp;/g, "&");
                source = "google-tbn";
                console.log(`[ProductImage] Google tbn: ${imageUrl.substring(0, 100)}`);
            }
        } catch (e: any) {
            console.warn("[ProductImage] Google Images failed:", e.message);
        }
    }

    // Cache the result
    if (imageUrl) {
        imageCache.set(query, { url: imageUrl, ts: Date.now() });
    }

    return NextResponse.json({ image_url: imageUrl, source });
}
