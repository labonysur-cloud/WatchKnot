export function formatVideoUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    const urlObj = new URL(url);
    
    // YouTube links: convert to embed
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      let videoId = "";
      if (urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.slice(1);
      } else {
        videoId = urlObj.searchParams.get("v") || "";
      }
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    
    // Google Drive links: convert view to preview
    if (urlObj.hostname.includes("drive.google.com")) {
      if (urlObj.pathname.includes("/view")) {
        return url.replace("/view", "/preview");
      }
      // sometimes drive links don't have /view but we need to ensure it's /preview
      // a typical drive link: https://drive.google.com/file/d/1X2Y3Z/view?usp=sharing
    }

    return url;
  } catch (e) {
    // If it's not a valid URL (e.g. just a string), return it as is
    return url;
  }
}
