import { useEffect, useRef, useState } from "react";

// Define the structure of incoming messages
interface ProgressMessage {
  jobId: string;
  message: string;
}

// Hook to handle WebSocket connection for progress updates
export const useWebSocketProgress = (jobId: string | null) => {
  const socket = useRef<WebSocket | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const ws = new window.WebSocket("wss://socialpilot-ai.onrender.com");

    ws.onopen = () => {
      console.log("🟢 WebSocket connected");
      ws.send(JSON.stringify({ jobId }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const { message } = JSON.parse(event.data) as ProgressMessage;
        setProgressMessage(message);
      } catch (error) {
        console.error("Invalid WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("🔴 WebSocket closed");
    };

    socket.current = ws;

    return () => {
      ws.close();
    };
  }, [jobId]);

  return { progressMessage, setProgressMessage };
};
