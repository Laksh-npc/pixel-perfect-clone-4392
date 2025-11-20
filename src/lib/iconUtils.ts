// Utility functions for generating consistent stock icons

// Color palette for stock icons - professional gradient colors
const ICON_COLORS = [
  // Blue shades
  { from: "from-blue-500", to: "to-blue-600" },
  { from: "from-blue-600", to: "to-blue-700" },
  { from: "from-cyan-500", to: "to-cyan-600" },
  { from: "from-sky-500", to: "to-sky-600" },
  // Green shades
  { from: "from-green-500", to: "to-green-600" },
  { from: "from-emerald-500", to: "to-emerald-600" },
  { from: "from-teal-500", to: "to-teal-600" },
  // Purple shades
  { from: "from-purple-500", to: "to-purple-600" },
  { from: "from-violet-500", to: "to-violet-600" },
  { from: "from-indigo-500", to: "to-indigo-600" },
  // Orange/Red shades
  { from: "from-orange-500", to: "to-orange-600" },
  { from: "from-amber-500", to: "to-amber-600" },
  { from: "from-red-500", to: "to-red-600" },
  { from: "from-rose-500", to: "to-rose-600" },
  // Pink shades
  { from: "from-pink-500", to: "to-pink-600" },
  { from: "from-fuchsia-500", to: "to-fuchsia-600" },
  // Gray shades
  { from: "from-gray-600", to: "to-gray-700" },
  { from: "from-slate-600", to: "to-slate-700" },
];

// Special color mappings for known stocks (optional - for brand consistency)
const SPECIAL_COLORS: Record<string, { from: string; to: string }> = {
  RELIANCE: { from: "from-amber-500", to: "to-amber-600" },
  EICHERMOT: { from: "from-red-500", to: "to-red-600" },
  BAJFINANCE: { from: "from-blue-600", to: "to-blue-700" },
  BAJAJFINSV: { from: "from-blue-600", to: "to-blue-700" },
  INFY: { from: "from-blue-500", to: "to-blue-600" },
  TCS: { from: "from-blue-600", to: "to-indigo-600" },
  HDFCBANK: { from: "from-red-600", to: "to-red-700" },
  IDEA: { from: "from-red-600", to: "to-red-700" },
  TATAGOLD: { from: "from-amber-600", to: "to-amber-700" },
  NEWGEN: { from: "from-blue-500", to: "to-blue-600" },
};

/**
 * Generate a hash from a string to consistently map to a color
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get icon text (initials) from company name and symbol
 */
export function getIconText(name: string, symbol: string): string {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  if (symbol && symbol.length >= 2) {
    return symbol.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "");
  }
  return name.substring(0, 2).toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * Get icon color classes based on symbol/name for consistent styling
 */
export function getIconColors(name: string, symbol: string): { from: string; to: string } {
  // Check for special color mapping first
  const symbolUpper = symbol?.toUpperCase() || "";
  if (SPECIAL_COLORS[symbolUpper]) {
    return SPECIAL_COLORS[symbolUpper];
  }

  // Use hash to consistently map to a color
  const key = symbolUpper || name.toUpperCase();
  const hash = hashString(key);
  const colorIndex = hash % ICON_COLORS.length;
  return ICON_COLORS[colorIndex];
}

/**
 * Get complete icon classes for Tailwind
 */
export function getIconClasses(name: string, symbol: string): string {
  const colors = getIconColors(name, symbol);
  return `bg-gradient-to-br ${colors.from} ${colors.to}`;
}

