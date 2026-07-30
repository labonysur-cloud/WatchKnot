"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Shield, Ticket, BookOpen, ChevronLeft, ChevronRight, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatVideoUrl } from "@/lib/videoUrl";

export default function TheaterMode({ movie }: { movie: any }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const querySeason = searchParams.get("season");
  const queryEpisode = searchParams.get("episode");

  const isTVShow = movie.seasonList && movie.seasonList.length > 0;
  
  const defaultSeason = isTVShow && movie.seasonList.length > 0 ? movie.seasonList[0].seasonNumber : null;
  const defaultEpisode = defaultSeason ? movie.seasonList[0].episodes[0]?.episodeNumber : null;

  const [activeSeason, setActiveSeason] = useState<number | null>(querySeason ? parseInt(querySeason) : defaultSeason);
  const [activeEpisode, setActiveEpisode] = useState<number | null>(queryEpisode ? parseInt(queryEpisode) : defaultEpisode);
  const [videoUrl, setVideoUrl] = useState(movie.videoUrl);
  const [titleDisplay, setTitleDisplay] = useState(movie.title);
  
  // Set the current playing video
  useEffect(() => {
    if (isTVShow && activeSeason !== null && activeEpisode !== null) {
      const season = movie.seasonList.find((s: any) => s.seasonNumber === activeSeason);
      if (season) {
        const episode = season.episodes.find((e: any) => e.episodeNumber === activeEpisode);
        if (episode) {
          setVideoUrl(episode.videoUrl);
          setTitleDisplay(`${movie.title} S${activeSeason} · E${activeEpisode}`);
        }
      }
    } else {
      setVideoUrl(movie.videoUrl);
      setTitleDisplay(movie.title);
    }
  }, [activeSeason, activeEpisode, isTVShow, movie]);

  const activeSeasonData = isTVShow ? movie.seasonList.find((s: any) => s.seasonNumber === activeSeason) : null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#1e1a1d] text-gray-200 overflow-hidden font-sans">
      {/* Top Bar */}
      <div className="h-14 bg-[#3a282f] flex items-center justify-between px-4 shadow-md shrink-0 border-b border-[#4d373e]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/movies/${movie.id}`)}
            className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="font-semibold text-white tracking-wide">{titleDisplay}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
            <Shield size={14} /> Shield Active
          </div>
          
          <Button variant="warm" size="sm" className="h-8 rounded-md text-xs px-3" onClick={() => router.push(`/movies/${movie.id}/ticket`)}>
            <Ticket className="w-3.5 h-3.5 mr-1" /> Get Ticket
          </Button>

          <Button variant="outline" size="sm" className="h-8 rounded-md text-xs px-3 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Journal
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Side: Video Player */}
        <div className="flex-1 bg-black relative flex flex-col">
          {videoUrl ? (
            <iframe
              src={formatVideoUrl(videoUrl)}
              className="w-full h-full border-none"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              title={`Watch ${titleDisplay}`}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <Play className="w-16 h-16 mb-4 opacity-20" />
              <p>No video source provided.</p>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar */}
        <div className="w-[340px] bg-[#2a2024] border-l border-[#3a282f] flex flex-col shrink-0 overflow-y-auto hidden md:flex">
          {/* Ad or resources banner area */}
          <div className="p-4 border-b border-[#3a282f]">
            <div className="w-full aspect-[2/1] rounded-lg bg-gradient-to-br from-indigo-900 to-purple-900 p-4 relative overflow-hidden flex flex-col justify-end">
              <div className="absolute inset-0 bg-black/20" />
              <h3 className="font-bold text-white relative z-10">Explore what's happening</h3>
              <p className="text-xs text-indigo-200 relative z-10 mt-1">Real-time stories · Global conversations</p>
            </div>
          </div>

          {/* Resources */}
          <div className="px-4 py-3 border-b border-[#3a282f]">
            <h3 className="font-semibold text-white">Resources</h3>
            <div className="text-xs text-gray-400 mt-1 flex justify-between">
              <span>Source: CozyCinema DB</span>
              <span>By {movie.addedBy?.name || "User"}</span>
            </div>
          </div>

          {/* Season / Episode Selector (If TV Show) */}
          {isTVShow ? (
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex gap-2 mb-4">
                <select className="bg-[#1e1a1d] border border-[#4d373e] text-xs text-gray-300 rounded px-2 py-1.5 flex-1 outline-none">
                  <option>Original Audio</option>
                  {movie.languageNote && <option>{movie.languageNote}</option>}
                </select>
                
                <select 
                  className="bg-[#1e1a1d] border border-[#4d373e] text-xs text-gray-300 rounded px-2 py-1.5 flex-1 outline-none"
                  value={activeSeason || ""}
                  onChange={(e) => {
                    const newSeason = parseInt(e.target.value);
                    setActiveSeason(newSeason);
                    const ep = movie.seasonList.find((s:any) => s.seasonNumber === newSeason)?.episodes[0]?.episodeNumber;
                    if (ep) setActiveEpisode(ep);
                  }}
                >
                  {movie.seasonList.map((s: any) => (
                    <option key={s.id} value={s.seasonNumber}>
                      Season {String(s.seasonNumber).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>

              {/* Episode Grid */}
              <div className="grid grid-cols-5 gap-2">
                {activeSeasonData?.episodes.map((ep: any) => {
                  const isActive = ep.episodeNumber === activeEpisode;
                  return (
                    <button
                      key={ep.id}
                      onClick={() => setActiveEpisode(ep.episodeNumber)}
                      className={`
                        aspect-square rounded flex items-center justify-center text-sm font-medium transition-colors
                        ${isActive 
                          ? 'bg-[#2a4d3e] text-green-400 border border-green-500/30' 
                          : 'bg-[#3a282f] text-gray-300 hover:bg-[#4d373e] border border-transparent'}
                      `}
                    >
                      {isActive ? (
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="w-1.5 h-3.5 bg-green-400 rounded-full" />
                        </div>
                      ) : (
                        String(ep.episodeNumber).padStart(2, "0")
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">
              <p>This is a standalone movie.</p>
              <p className="mt-2 text-xs">Enjoy the show!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
