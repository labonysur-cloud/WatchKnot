export function formatVideoUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    let formattedUrl = url;
    
    // Check if it's already an embed URL
    if (formattedUrl.includes("/embed/") || formattedUrl.includes("/preview")) {
       return formattedUrl;
    }

    const urlObj = new URL(url);
    
    // YouTube links: convert to embed
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      let videoId = "";
      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.pathname.startsWith("/shorts/")) {
        videoId = urlObj.pathname.replace("/shorts/", "");
      } else if (urlObj.pathname.startsWith("/live/")) {
        videoId = urlObj.pathname.replace("/live/", "");
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }
      
      if (videoId && videoId.includes("?")) {
        videoId = videoId.split("?")[0];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Google Drive links: convert to preview
    if (urlObj.hostname.includes("drive.google.com")) {
      if (urlObj.pathname.includes("/view")) {
        return url.replace("/view", "/preview");
      }
      
      const pathSegments = urlObj.pathname.split('/');
      if (pathSegments.includes('d')) {
        const dIndex = pathSegments.indexOf('d');
        if (dIndex !== -1 && pathSegments.length > dIndex + 1) {
          const fileId = pathSegments[dIndex + 1];
          return `https://drive.google.com/file/d/${fileId}/preview`;
        }
      } 
      
      const fileId = urlObj.searchParams.get('id');
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }

    return url;
  } catch (e) {
    return url;
  }
}

export function isEmbedUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const formatted = formatVideoUrl(url).toLowerCase();
    
    // If it looks like a direct video file or cloud storage blob, it's NOT an embed
    if (
      /\.(mp4|webm|ogg|mkv|mov|avi)$/i.test(formatted) ||
      formatted.includes("firebasestorage.googleapis.com") ||
      formatted.includes("res.cloudinary.com")
    ) {
      return false;
    }
    
    // If it's formatted as youtube embed, google drive preview, vimeo, dailymotion, etc
    if (
      formatted.includes("youtube.com/embed") ||
      formatted.includes("drive.google.com") ||
      formatted.includes("vimeo.com") ||
      formatted.includes("dailymotion.com") ||
      formatted.includes("player.")
    ) {
      return true;
    }
    
    return false;
  } catch (e) {
    return false;
  }
}
