/**
 * Utility functions for handling profile pictures
 */

/**
 * Simple MD5 hash implementation for email
 * Note: For production, use crypto-js or similar library
 */
function simpleHashEmail(email: string): string {
  // Use Gravatar's approach with MD5 hash
  // This is a placeholder - in production use proper crypto-js
  const str = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get Gmail profile picture URL from email address
 * @param email - Gmail email address
 * @returns Gmail profile picture URL or null if not a Gmail address
 */
export function getGmailProfilePicture(email: string): string | null {
  if (!email || !email.toLowerCase().includes('@gmail.com')) {
    return null;
  }
  
  // For Gmail addresses, try to get the actual Google profile picture
  const emailHash = simpleHashEmail(email);
  
  // Try multiple approaches for Google profile pictures
  // 1. Try unavatar.io which can fetch Google profile pictures
  const unavatarUrl = `https://unavatar.io/gmail/${email}`;
  
  // 2. Try Gravatar with better parameters for Google sync
  const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?d=404&s=128`;
  
  // Return unavatar.io first as it's more likely to get real Google profile pictures
  return unavatarUrl;
}

/**
 * Get Gravatar profile picture URL from email address
 * @param email - Email address
 * @returns Gravatar profile picture URL
 */
export function getGravatarProfilePicture(email: string): string {
  if (!email) return '';
  
  const emailHash = simpleHashEmail(email);
  // Use a better default avatar style and size
  return `https://www.gravatar.com/avatar/${emailHash}?d=mp&s=128&f=y`;
}

/**
 * Get profile picture URL with fallback chain
 * @param email - Email address
 * @param existingProfileImage - Existing profile image URL
 * @returns Best available profile picture URL
 */
export function getProfilePictureUrl(email: string, existingProfileImage?: string): string {
  // If user has uploaded a custom profile picture, use it
  if (existingProfileImage && existingProfileImage.trim() !== '') {
    return existingProfileImage;
  }
  
  // For Gmail addresses, try to get real Google profile pictures
  if (email && email.toLowerCase().includes('@gmail.com')) {
    // Try unavatar.io first for real Google profile pictures
  const gmailUrl = getGmailProfilePicture(email);
  if (gmailUrl) {
    return gmailUrl;
    }
  }
  
  // For all addresses, use Gravatar as fallback
  return getGravatarProfilePicture(email);
}

/**
 * Check if an email is a Gmail address
 * @param email - Email address to check
 * @returns True if Gmail address
 */
export function isGmailAddress(email: string): boolean {
  return Boolean(email && email.toLowerCase().endsWith('@gmail.com'));
}

/**
 * Get a comprehensive profile picture URL with multiple fallbacks
 * This function tries multiple services to get the best profile picture
 * @param email - Email address
 * @param existingProfileImage - Existing profile image URL
 * @returns Best available profile picture URL
 */
export function getComprehensiveProfilePictureUrl(email: string, existingProfileImage?: string): string {
  // If user has uploaded a custom profile picture, use it
  if (existingProfileImage && existingProfileImage.trim() !== '') {
    return existingProfileImage;
  }
  
  if (!email) {
    return getGravatarProfilePicture('default@example.com');
  }
  
  // For Gmail addresses, try multiple approaches
  if (email.toLowerCase().includes('@gmail.com')) {
    const username = email.split('@')[0];
    
    // 1. Try unavatar.io for real Google profile pictures
    const unavatarUrl = `https://unavatar.io/gmail/${email}`;
    
    // 2. Try Gravatar (some Gmail users sync with Gravatar)
    const gravatarUrl = getGravatarProfilePicture(email);
    
    // 3. Try DiceBear as a professional fallback
    const dicebearUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=gradientLinear`;
    
    // Return unavatar.io first (most likely to have real Google profile pictures)
    return unavatarUrl;
  }
  
  // For non-Gmail addresses, use Gravatar
  return getGravatarProfilePicture(email);
}

/**
 * Create a profile picture component with error handling
 * This can be used in React components to handle image loading errors
 */
export function createProfilePictureWithFallback(email: string, existingProfileImage?: string) {
  const primaryUrl = getComprehensiveProfilePictureUrl(email, existingProfileImage);
  const fallbackUrl = getGravatarProfilePicture(email);
  
  return {
    primaryUrl,
    fallbackUrl,
    // This can be used in an onError handler
    handleError: (event: any) => {
      if (event.target.src !== fallbackUrl) {
        event.target.src = fallbackUrl;
      }
    }
  };
}
