/**
 * Image utility functions for dynamic image selection
 * Implements YouTube-style fallback system for course and test images
 */

export interface ImageConfig {
  category: string;
  level: string;
  type?: string;
  tier?: string;
}

/**
 * Default image mapping for courses and tests
 * Based on category, level, and type
 */
export const DEFAULT_IMAGES = {
  // Course categories
  courses: {
    GRAMMAR: {
      A1: '/images/defaults/courses/grammar-a1.html',
      A2: '/images/defaults/courses/grammar-a2.html',
      B1: '/images/defaults/courses/grammar-b1.html',
      B2: '/images/defaults/courses/grammar-b2.html',
      C1: '/images/defaults/courses/grammar-c1.html',
      C2: '/images/defaults/courses/grammar-c2.html',
    },
    LISTENING: {
      A1: '/images/defaults/courses/listening-a1.html',
      A2: '/images/defaults/courses/listening-a2.html',
      B1: '/images/defaults/courses/listening-b1.html',
      B2: '/images/defaults/courses/listening-b2.html',
      C1: '/images/defaults/courses/listening-c1.html',
      C2: '/images/defaults/courses/listening-c2.html',
    },
    SPEAKING: {
      A1: '/images/defaults/courses/speaking-a1.html',
      A2: '/images/defaults/courses/speaking-a2.html',
      B1: '/images/defaults/courses/speaking-b1.html',
      B2: '/images/defaults/courses/speaking-b2.html',
      C1: '/images/defaults/courses/speaking-c1.html',
      C2: '/images/defaults/courses/speaking-c2.html',
    },
    READING: {
      A1: '/images/defaults/courses/reading-a1.html',
      A2: '/images/defaults/courses/reading-a2.html',
      B1: '/images/defaults/courses/reading-b1.html',
      B2: '/images/defaults/courses/reading-b2.html',
      C1: '/images/defaults/courses/reading-c1.html',
      C2: '/images/defaults/courses/reading-c2.html',
    },
    WRITING: {
      A1: '/images/defaults/courses/writing-a1.html',
      A2: '/images/defaults/courses/writing-a2.html',
      B1: '/images/defaults/courses/writing-b1.html',
      B2: '/images/defaults/courses/writing-b2.html',
      C1: '/images/defaults/courses/writing-c1.html',
      C2: '/images/defaults/courses/writing-c2.html',
    },
    VOCABULARY: {
      A1: '/images/defaults/courses/vocabulary-a1.html',
      A2: '/images/defaults/courses/vocabulary-a2.html',
      B1: '/images/defaults/courses/vocabulary-b1.html',
      B2: '/images/defaults/courses/vocabulary-b2.html',
      C1: '/images/defaults/courses/vocabulary-c1.html',
      C2: '/images/defaults/courses/vocabulary-c2.html',
    },
  },
  // Test categories
  tests: {
    TCF: {
      A1: '/images/defaults/tests/tcf-a1.html',
      A2: '/images/defaults/tests/tcf-a2.html',
      B1: '/images/defaults/tests/tcf-b1.html',
      B2: '/images/defaults/tests/tcf-b2.html',
      C1: '/images/defaults/tests/tcf-c1.html',
      C2: '/images/defaults/tests/tcf-c2.html',
    },
    TEF: {
      A1: '/images/defaults/tests/tef-a1.html',
      A2: '/images/defaults/tests/tef-a2.html',
      B1: '/images/defaults/tests/tef-b1.html',
      B2: '/images/defaults/tests/tef-b2.html',
      C1: '/images/defaults/tests/tef-c1.html',
      C2: '/images/defaults/tests/tef-c2.html',
    },
    DELF: {
      A1: '/images/defaults/tests/delf-a1.html',
      A2: '/images/defaults/tests/delf-a2.html',
      B1: '/images/defaults/tests/delf-b1.html',
      B2: '/images/defaults/tests/delf-b2.html',
      C1: '/images/defaults/tests/delf-c1.html',
      C2: '/images/defaults/tests/delf-c2.html',
    },
    DALF: {
      A1: '/images/defaults/tests/dalf-a1.html',
      A2: '/images/defaults/tests/dalf-a2.html',
      B1: '/images/defaults/tests/dalf-b1.html',
      B2: '/images/defaults/tests/dalf-b2.html',
      C1: '/images/defaults/tests/dalf-c1.html',
      C2: '/images/defaults/tests/dalf-c2.html',
    },
    GRAMMAR: {
      A1: '/images/defaults/tests/grammar-a1.html',
      A2: '/images/defaults/tests/grammar-a2.html',
      B1: '/images/defaults/tests/grammar-b1.html',
      B2: '/images/defaults/tests/grammar-b2.html',
      C1: '/images/defaults/tests/grammar-c1.html',
      C2: '/images/defaults/tests/grammar-c2.html',
    },
    LISTENING: {
      A1: '/images/defaults/tests/listening-a1.html',
      A2: '/images/defaults/tests/listening-a2.html',
      B1: '/images/defaults/tests/listening-b1.html',
      B2: '/images/defaults/tests/listening-b2.html',
      C1: '/images/defaults/tests/listening-c1.html',
      C2: '/images/defaults/tests/listening-c2.html',
    },
    SPEAKING: {
      A1: '/images/defaults/tests/speaking-a1.html',
      A2: '/images/defaults/tests/speaking-a2.html',
      B1: '/images/defaults/tests/speaking-b1.html',
      B2: '/images/defaults/tests/speaking-b2.html',
      C1: '/images/defaults/tests/speaking-c1.html',
      C2: '/images/defaults/tests/speaking-c2.html',
    },
    READING: {
      A1: '/images/defaults/tests/reading-a1.html',
      A2: '/images/defaults/tests/reading-a2.html',
      B1: '/images/defaults/tests/reading-b1.html',
      B2: '/images/defaults/tests/reading-b2.html',
      C1: '/images/defaults/tests/reading-c1.html',
      C2: '/images/defaults/tests/reading-c2.html',
    },
    WRITING: {
      A1: '/images/defaults/tests/writing-a1.html',
      A2: '/images/defaults/tests/writing-a2.html',
      B1: '/images/defaults/tests/writing-b1.html',
      B2: '/images/defaults/tests/writing-b2.html',
      C1: '/images/defaults/tests/writing-c1.html',
      C2: '/images/defaults/tests/writing-c2.html',
    },
    VOCABULARY: {
      A1: '/images/defaults/tests/vocabulary-a1.html',
      A2: '/images/defaults/tests/vocabulary-a2.html',
      B1: '/images/defaults/tests/vocabulary-b1.html',
      B2: '/images/defaults/tests/vocabulary-b2.html',
      C1: '/images/defaults/tests/vocabulary-c1.html',
      C2: '/images/defaults/tests/vocabulary-c2.html',
    },
  },
  // Fallback images
  fallbacks: {
    course: '/images/defaults/courses/default.html',
    test: '/images/defaults/tests/default.html',
    platform: '/images/defaults/platform-default.html',
  },
} as const;

/**
 * Get the appropriate image URL for a course
 * Implements YouTube-style fallback system
 */
export function getCourseImage(course: {
  image?: string | null;
  category: string;
  level: string;
  requiredTier?: string;
}): string {
  // 1. Use custom image if available
  if (course.image && course.image.trim() !== '') {
    return course.image;
  }

  // 2. Use category and level-based default
  const categoryImages = DEFAULT_IMAGES.courses[course.category as keyof typeof DEFAULT_IMAGES.courses];
  if (categoryImages && categoryImages[course.level as keyof typeof categoryImages]) {
    return categoryImages[course.level as keyof typeof categoryImages];
  }

  // 3. Use category default (any level)
  if (categoryImages) {
    const firstLevel = Object.keys(categoryImages)[0] as keyof typeof categoryImages;
    return categoryImages[firstLevel];
  }

  // 4. Use platform fallback
  return DEFAULT_IMAGES.fallbacks.course;
}

/**
 * Get the appropriate image URL for a test
 * Implements YouTube-style fallback system
 */
export function getTestImage(test: {
  image?: string | null;
  category: string;
  level: string;
  type?: string;
  requiredTier?: string;
}): string {
  // 1. Use custom image if available
  if (test.image && test.image.trim() !== '') {
    return test.image;
  }

  // 2. Use category and level-based default
  const categoryImages = DEFAULT_IMAGES.tests[test.category as keyof typeof DEFAULT_IMAGES.tests];
  if (categoryImages && categoryImages[test.level as keyof typeof categoryImages]) {
    return categoryImages[test.level as keyof typeof categoryImages];
  }

  // 3. Use category default (any level)
  if (categoryImages) {
    const firstLevel = Object.keys(categoryImages)[0] as keyof typeof categoryImages;
    return categoryImages[firstLevel];
  }

  // 4. Use platform fallback
  return DEFAULT_IMAGES.fallbacks.test;
}

/**
 * Get image with responsive sizing
 * Returns optimized image URL for different screen sizes
 */
export function getResponsiveImage(
  baseImage: string,
  size: 'thumbnail' | 'medium' | 'large' | 'full' = 'medium'
): string {
  // For now, return the base image
  // In the future, this can be enhanced to return Cloudinary URLs with transformations
  return baseImage;
}

/**
 * Generate placeholder image URL
 * Creates a placeholder with text overlay
 */
export function generatePlaceholderImage(
  text: string,
  width: number = 400,
  height: number = 300,
  backgroundColor: string = '#f3f4f6',
  textColor: string = '#6b7280'
): string {
  // This would generate a placeholder image with the specified text
  // For now, return a simple placeholder
  return `/images/placeholder-${width}x${height}.jpg`;
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get image alt text based on content
 */
export function getImageAltText(
  type: 'course' | 'test',
  title: string,
  category: string,
  level: string
): string {
  return `${type === 'course' ? 'Course' : 'Test'}: ${title} - ${category} ${level}`;
}
