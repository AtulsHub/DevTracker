/**
 * src/app/api/contests/ics/route.ts
 * GET /api/contests/ics — Generate .ics calendar file for contests
 * Query params: platform, startDate, endDate
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { getContests } from "@/server/services/contests";

const querySchema = z.object({
  platform: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  filename: z.string().default("devtrack-contests.ics"),
});

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function generateICS(contests: Array<{
  name: string;
  url?: string;
  startsAt: Date;
  durationSeconds?: number;
  platform: string;
  externalId: string;
}>): string {
  const now = new Date();
  const dtStamp = formatICSDate(now);

  const events = contests.map((c) => {
    const dtStart = formatICSDate(c.startsAt);
    const duration = c.durationSeconds ? c.durationSeconds : 7200; // Default 2 hours
    const dtEnd = formatICSDate(new Date(c.startsAt.getTime() + duration * 1000));
    const uid = `${c.platform}-${c.externalId}@devtrack`;
    const summary = escapeICSText(c.name);
    const description = escapeICSText(
      `Platform: ${c.platform}\nContest: ${c.name}\n${c.url ? `URL: ${c.url}` : ""}`
    );
    const url = c.url ? escapeICSText(c.url) : "";

    return [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      url ? `URL:${url}` : "",
      "END:VEVENT",
    ].filter(Boolean).join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DevTrack//Contest Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid query parameters" },
        { status: 400 }
      );
    }

    const { platform, startDate, endDate, filename } = parsed.data;

    const contests = await getContests({
      platform,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: 500,
    });

    const icsContent = generateICS(contests);

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: unknown) {
    console.error("[GET /api/contests/ics] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate calendar" },
      { status: 500 }
    );
  }
}