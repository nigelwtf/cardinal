/** A colour faded towards transparent, so it reads over either theme's background. */
export const tint = (color: string, percent: number) =>
  `color-mix(in oklab, ${color} ${percent}%, transparent)`;
