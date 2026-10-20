/**
 * Image helper utility for converting Google Drive URLs and base64 into displayable image sources
 */

/**
 * Returns a URL suitable for `<img src="..." />`
 */
export const getDisplayImageUrl = (imageUrl?: string | null): string => {
  if (!imageUrl) return '';

  // If truncated or corrupted base64 from previous sheets, ignore
  if (imageUrl.startsWith('data:image') && imageUrl.length < 300) {
    return '';
  }

  // If it's a Google Drive link, extract the fileId and return the direct thumbnail URL
  const driveIdMatch = imageUrl.match(/(?:\/file\/d\/|\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    const fileId = driveIdMatch[1];
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }

  return imageUrl;
};

/**
 * Returns the direct Google Drive webpage link (for opening in a new tab)
 */
export const getDriveViewUrl = (imageUrl?: string | null): string | null => {
  if (!imageUrl) return null;

  const driveIdMatch = imageUrl.match(/(?:\/file\/d\/|\/d\/|[?&]id=)([a-zA-Z0-9_-]+)/);
  if (driveIdMatch && driveIdMatch[1]) {
    return `https://drive.google.com/file/d/${driveIdMatch[1]}/view`;
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  return null;
};
