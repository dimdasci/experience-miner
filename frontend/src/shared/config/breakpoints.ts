/**
 * Centralized breakpoint configuration for the Espejo design system
 * 
 * This ensures consistency between:
 * - JavaScript layout switching logic (useViewport hook)
 * - CSS responsive utilities (Tailwind md: prefix)
 * - Any other responsive behavior
 */

export const BREAKPOINTS = {
  // Main desktop/mobile breakpoint
  // Matches Tailwind's default 'md' breakpoint
  DESKTOP: 768,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Check if current viewport width qualifies as desktop
 * @param width - Current viewport width in pixels
 * @returns true if desktop, false if mobile
 */
export const isDesktop = (width: number): boolean => {
  return width >= BREAKPOINTS.DESKTOP;
};

/**
 * Get viewport type based on width
 * @param width - Current viewport width in pixels
 * @returns 'desktop' | 'mobile'
 */
export const getViewportType = (width: number): 'desktop' | 'mobile' => {
  return isDesktop(width) ? 'desktop' : 'mobile';
};