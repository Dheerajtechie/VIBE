export function metersToLabel(m: number): string {
  if (m < 75) return "50m away";
  if (m < 150) return "same block";
  if (m < 300) return "2 streets over";
  if (m < 600) return `${Math.round(m / 100) * 100}m away`;
  return `${(m / 1000).toFixed(1)}km away`;
}


