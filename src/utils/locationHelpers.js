export function ratingColor(avgRating) {
  if (avgRating === null) return "#95a5a6";
  if (avgRating <= 2) return "#2ecc71";
  if (avgRating <= 3.5) return "#f1c40f";
  if (avgRating <= 4.5) return "#e67e22";
  return "#e74c3c";
}

export function ratingLabel(avgRating) {
  if (avgRating === null) return "No ratings yet";
  if (avgRating <= 2) return "Quiet";
  if (avgRating <= 3.5) return "Moderate";
  if (avgRating <= 4.5) return "Noisy";
  return "Very loud";
}

export function matchesNoiseFilter(noiseFilter, avgRating) {
  if (noiseFilter === "all") return true;
  if (avgRating === null) return false;

  if (noiseFilter === "quiet") return avgRating <= 2;
  if (noiseFilter === "moderate") return avgRating > 2 && avgRating <= 3.5;
  if (noiseFilter === "noisy") return avgRating > 3.5 && avgRating <= 4.5;
  if (noiseFilter === "very-loud") return avgRating > 4.5;

  return true;
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "No ratings yet";

  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

  return new Date(timestamp).toLocaleString();
}
