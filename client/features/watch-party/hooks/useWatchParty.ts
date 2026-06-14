"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "@/shared/providers/WebSocketProvider";

type PlayerState = -1 | 0 | 1 | 2 | 3 | 5;

type YouTubePlayer = {
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  destroy: () => void;
  getCurrentTime: () => number;
  getPlayerState: () => PlayerState;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
};

type YouTubeNamespace = {
  Player: new (
    elementId: string,
    options: {
      height: string;
      width: string;
      playerVars: {
        controls: number;
        playsinline: number;
        rel: number;
      };
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
        onStateChange: (event: {
          data: PlayerState;
          target: YouTubePlayer;
        }) => void;
      };
    },
  ) => YouTubePlayer;
  PlayerState: {
    PLAYING: 1;
    PAUSED: 2;
  };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YouTubeNamespace> | null = null;

function loadYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<YouTubeNamespace>((resolve) => {
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      if (window.YT) resolve(window.YT);
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

export function parseYouTubeVideoId(value: string) {
  const input = value.trim();
  if (/^[\w-]{11}$/.test(input)) return input;

  try {
    const url = new URL(input);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] ?? null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      const parts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(parts[0])) {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function useWatchParty(roomId: number) {
  const { send, subscribe } = useWebSocket();
  const playerRef = useRef<YouTubePlayer | null>(null);
  const applyingRemoteRef = useRef(false);
  const pendingRemoteRef = useRef<{
    event: "play" | "pause" | "seek" | "url";
    videoTime: number;
    videoUrl?: string;
  } | null>(null);
  const lastObservedTimeRef = useRef(0);
  const lastObservedAtRef = useRef(Date.now());
  const playerElementId = `watchline-youtube-player-${roomId}`;
  const [videoId, setVideoId] = useState("");
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const sendSync = useCallback(
    (
      event: "play" | "pause" | "seek" | "url",
      nextVideoId?: string,
    ) => {
      if (applyingRemoteRef.current) return;
      send({
        type: "VIDEO_SYNC",
        roomId,
        event,
        videoTime: playerRef.current?.getCurrentTime() ?? 0,
        ...(nextVideoId
          ? {
              videoUrl: `https://www.youtube.com/watch?v=${nextVideoId}`,
            }
          : {}),
      });
    },
    [roomId, send],
  );

  const applyRemoteState = useCallback(
    (remote: {
      event: "play" | "pause" | "seek" | "url";
      videoTime: number;
      videoUrl?: string;
    }) => {
      const player = playerRef.current;
      if (!player) {
        pendingRemoteRef.current = remote;
        return;
      }

      applyingRemoteRef.current = true;
      const remoteVideoId = remote.videoUrl
        ? parseYouTubeVideoId(remote.videoUrl)
        : null;

      if (remoteVideoId) {
        setVideoId(remoteVideoId);
        player.cueVideoById({
          videoId: remoteVideoId,
          startSeconds: remote.videoTime,
        });
      } else if (
        Math.abs(player.getCurrentTime() - remote.videoTime) > 0.75
      ) {
        player.seekTo(remote.videoTime, true);
      }

      if (remote.event === "play") player.playVideo();
      if (remote.event === "pause") player.pauseVideo();
      if (remote.event === "seek") player.seekTo(remote.videoTime, true);

      lastObservedTimeRef.current = remote.videoTime;
      lastObservedAtRef.current = Date.now();
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 700);
    },
    [],
  );

  useEffect(() => {
    let disposed = false;

    void loadYouTubeApi().then((YT) => {
      if (disposed || playerRef.current) return;
      playerRef.current = new YT.Player(playerElementId, {
        height: "100%",
        width: "100%",
        playerVars: {
          controls: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: ({ target }) => {
            if (disposed) return;
            playerRef.current = target;
            setIsPlayerReady(true);
            if (pendingRemoteRef.current) {
              applyRemoteState(pendingRemoteRef.current);
              pendingRemoteRef.current = null;
            }
          },
          onStateChange: ({ data }) => {
            if (applyingRemoteRef.current) return;
            if (data === YT.PlayerState.PLAYING) sendSync("play");
            if (data === YT.PlayerState.PAUSED) sendSync("pause");
          },
        },
      });
    });

    return () => {
      disposed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [applyRemoteState, playerElementId, sendSync]);

  useEffect(
    () =>
      subscribe((message) => {
        if (message.type !== "VIDEO_STATE" || message.roomId !== roomId) return;
        applyRemoteState(message);
        setLastSync(`${message.username} menyinkronkan video`);
      }),
    [applyRemoteState, roomId, subscribe],
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || applyingRemoteRef.current) {
        return;
      }

      const playerState = player.getPlayerState();
      if (playerState !== 1 && playerState !== 2) return;

      const now = Date.now();
      const currentTime = player.getCurrentTime();
      const elapsed = (now - lastObservedAtRef.current) / 1000;
      const expectedTime =
        playerState === 1
          ? lastObservedTimeRef.current + elapsed
          : lastObservedTimeRef.current;

      if (
        lastObservedTimeRef.current > 0 &&
        Math.abs(currentTime - expectedTime) > 1.5
      ) {
        sendSync("seek");
      }

      lastObservedTimeRef.current = currentTime;
      lastObservedAtRef.current = now;
    }, 500);

    return () => window.clearInterval(timer);
  }, [sendSync]);

  const changeVideo = (value: string) => {
    const nextVideoId = parseYouTubeVideoId(value);
    if (!nextVideoId || !playerRef.current) return false;

    applyingRemoteRef.current = true;
    setVideoId(nextVideoId);
    playerRef.current.cueVideoById({ videoId: nextVideoId, startSeconds: 0 });
    window.setTimeout(() => {
      applyingRemoteRef.current = false;
    }, 500);
    send({
      type: "VIDEO_SYNC",
      roomId,
      event: "url",
      videoTime: 0,
      videoUrl: `https://www.youtube.com/watch?v=${nextVideoId}`,
    });
    return true;
  };

  return {
    playerElementId,
    videoId,
    isPlayerReady,
    lastSync,
    changeVideo,
  };
}
