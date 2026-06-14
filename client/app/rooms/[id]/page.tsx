import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DashboardView } from "@/features/dashboard/views/DashboardView";

export const metadata: Metadata = {
  title: "Watch Room | WatchLine",
};

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const roomId = Number(id);

  if (!Number.isInteger(roomId) || roomId < 1) notFound();

  return <DashboardView selectedRoomId={roomId} />;
}
