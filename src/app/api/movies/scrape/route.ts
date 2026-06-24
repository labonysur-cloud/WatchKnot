import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import Groq from "groq-sdk";
import { getAuthUser } from "@/lib/getAuthUser";

// Initialize Groq (ensure GROQ_API_KEY is in .env)
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export const maxDuration = 60; // Maximize Vercel timeout allowance

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    // 1. Scrape the URL (try our best, don't throw if it fails)
    let html = "";
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout to avoid Vercel 10s kill
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        html = await response.text();
      }
    } catch (err) {
      console.warn("Failed to fetch URL directly, continuing with empty HTML", err);
    }

    const $ = cheerio.load(html);

    const scrapedTitle = $('meta[property="og:title"]').attr("content") || $("title").text() || "";
    const scrapedDesc = $('meta[property="og:description"]').attr("content") || $('meta[name="description"]').attr("content") || "";
    const scrapedImage = $('meta[property="og:image"]').attr("content") || "";

    // If Groq is not configured, return raw scraped data
    if (!groq) {
      return NextResponse.json({
        title: scrapedTitle.replace(/( - IMDb| - TMDB| - Letterboxd)/g, "").trim(),
        description: scrapedDesc,
        posterUrl: scrapedImage,
        year: new Date().getFullYear(),
        genre: "Unknown",
        rating: 0,
        mediaType: "Movie",
        seasons: null,
      });
    }

    // 2. Use Groq AI to structure and classify the data
    const prompt = `
      I have a URL to a movie/TV show: "${url}"
      And I scraped this data from the page:
      Raw Title: "${scrapedTitle}"
      Raw Description: "${scrapedDesc}"

      Please extract the exact details and classify it. If the scraped data is empty, try to guess the movie title from the URL itself (e.g. from a slug).
      Return ONLY a raw JSON object with the following keys, without any markdown formatting or backticks:
      - title (String: The clean title without "IMDb" or tags. If unknown, leave empty string)
      - year (Number: Release year if found, otherwise null)
      - genre (String: Comma separated list of 1-3 best matching genres, e.g. "Action, Sci-Fi")
      - description (String: Cleaned up description. If unknown, leave empty string)
      - rating (Number: If a rating out of 10 is mentioned, put it here, otherwise 0)
      - mediaType (String: MUST be one of "Movie", "TV Show", "Web Series", or "Anime")
      - seasons (Number: Total number of seasons if it's a show/series, otherwise null)
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192", // Fast and free
      temperature: 0.1,
    });

    const aiText = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Clean up markdown block if Groq returned it
    const cleanJsonText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const parsed = JSON.parse(cleanJsonText);
      return NextResponse.json({
        title: parsed.title || scrapedTitle,
        year: parsed.year || null,
        genre: parsed.genre || "Unknown",
        description: parsed.description || scrapedDesc,
        rating: parsed.rating || 0,
        mediaType: parsed.mediaType || "Movie",
        seasons: parsed.seasons || null,
        posterUrl: scrapedImage,
      });
    } catch (parseError) {
      // Fallback if AI JSON fails
      return NextResponse.json({
        title: scrapedTitle,
        description: scrapedDesc,
        posterUrl: scrapedImage,
        genre: "Unknown",
        year: null,
        rating: 0,
        mediaType: "Movie",
        seasons: null,
      });
    }

  } catch (error: any) {
    console.error("Scraping error:", error);
    // Return empty fields instead of a hard 500 error so the UI form can still be edited
    return NextResponse.json({ 
      title: "",
      description: "",
      posterUrl: "",
      genre: "Unknown",
      year: null,
      rating: 0,
      mediaType: "Movie",
      seasons: null,
    });
  }
}
