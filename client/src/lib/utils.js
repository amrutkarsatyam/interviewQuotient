// src/lib/utils.js
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to conditionally join class names together.
 * It uses 'tailwind-merge' to intelligently merge Tailwind CSS classes,
 * preventing style conflicts.
 *
 * @param {...(string | null | undefined | boolean | object)} inputs - The class names or conditions.
 * @returns {string} The merged and final class name string.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}