export async function getLiveKitToken(roomName: string): Promise<{
  token: string;
  serverUrl: string;
}> {
  const res = await fetch(`/api/livekit?room=${encodeURIComponent(roomName)}`);

  if (!res.ok) {
    throw new Error(`Failed to get LiveKit token: ${res.statusText}`);
  }

  return res.json() as Promise<{ token: string; serverUrl: string }>;
}
