export const NOISE_LEVEL_SCALE = [
  { value: "quiet", label: "Quiet", min: 0, max: 2 },
  { value: "moderate", label: "Moderate", min: 2, max: 3.5 },
  { value: "noisy", label: "Noisy", min: 3.5, max: 4.5 },
  { value: "very-loud", label: "Very loud", min: 4.5, max: 5 },
];

export const CROWD_FILTER_OPTIONS = [
  { value: "all", label: "All crowd levels" },
  { value: "Plenty of seats", label: "Plenty of seats" },
  { value: "Limited seats", label: "Limited seats" },
  { value: "Full", label: "Full" },
];

export function getNoiseLevel(avgRating) {
  if (avgRating === null) return null;
  if (avgRating <= 2) return NOISE_LEVEL_SCALE[0];
  if (avgRating <= 3.5) return NOISE_LEVEL_SCALE[1];
  if (avgRating <= 4.5) return NOISE_LEVEL_SCALE[2];
  return NOISE_LEVEL_SCALE[3];
}

export function ratingColor(avgRating) {
  if (avgRating === null) return "#95a5a6";
  if (avgRating <= 2) return "#2ecc71";
  if (avgRating <= 3.5) return "#f1c40f";
  if (avgRating <= 4.5) return "#e67e22";
  return "#e74c3c";
}

export function ratingLabel(avgRating) {
  return getNoiseLevel(avgRating)?.label ?? "No recent data";
}

export function matchesNoiseFilter(noiseFilter, avgRating) {
  if (noiseFilter === "all") return true;
  if (avgRating === null) return false;

  return getNoiseLevel(avgRating)?.value === noiseFilter;
}

export function matchesCrowdFilter(crowdFilter, crowdLabel) {
  if (crowdFilter === "all") return true;
  if (!crowdLabel || crowdLabel === "Unknown") return false;

  return crowdLabel === crowdFilter;
}

export function sortLocationsByNoise(locations, getAverageRating, sortOrder = "default") {
  if (sortOrder !== "quietest") return locations;

  return [...locations].sort((left, right) => {
    const leftRating = getAverageRating(left.id);
    const rightRating = getAverageRating(right.id);

    if (leftRating === null && rightRating === null) {
      return left.name.localeCompare(right.name);
    }

    if (leftRating === null) return 1;
    if (rightRating === null) return -1;
    if (leftRating === rightRating) return left.name.localeCompare(right.name);

    return leftRating - rightRating;
  });
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return "No recent data";

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
