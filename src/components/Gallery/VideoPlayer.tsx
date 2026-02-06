"use client";

import MuxPlayer from "@mux/mux-player-react";

interface VideoPlayerProps {
  playbackId?: string;
  src?: string;
  title?: string;
}

export function VideoPlayer({ playbackId, src, title }: VideoPlayerProps) {
  if (playbackId) {
    return (
      <MuxPlayer
        playbackId={playbackId}
        metadata={{ video_title: title || "Generated Video" }}
        streamType="on-demand"
        accentColor="#6366f1"
        style={{ width: "100%", maxHeight: "70vh", borderRadius: "12px" }}
      />
    );
  }

  if (src) {
    return (
      <video
        src={src}
        controls
        playsInline
        style={{ width: "100%", maxHeight: "70vh", borderRadius: "12px" }}
      >
        <track kind="captions" />
      </video>
    );
  }

  return null;
}
