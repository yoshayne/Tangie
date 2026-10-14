/** Small formatting helpers shared by the data loaders. */

export function monthDay(date: Date, timeZone: string) {
  const month = new Intl.DateTimeFormat("en-US", { month: "short", timeZone })
    .format(date)
    .toUpperCase();
  const day = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    timeZone,
  }).format(date);
  return { month, day };
}

export function longDate(date: Date, timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(date);
}
