/**
 * Build a Google Calendar "create event" deep link (no OAuth required).
 * Opens Google's event template with prefilled contest details.
 */

function toGCalStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export function googleCalendarEventUrl(input: {
  title: string;
  startsAt: Date | string;
  durationSeconds?: number | null;
  description?: string;
  location?: string | null;
}): string {
  const start = new Date(input.startsAt);
  const durationMs = (input.durationSeconds ?? 7200) * 1000;
  const end = new Date(start.getTime() + durationMs);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${toGCalStamp(start)}/${toGCalStamp(end)}`,
  });

  if (input.description?.trim()) {
    params.set("details", input.description.trim());
  }
  if (input.location?.trim()) {
    params.set("location", input.location.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
