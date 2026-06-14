import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/views/DashboardView";

export const metadata: Metadata = {
  title: "Rooms | WatchLine",
};

export default function RoomsPage() {
  return <DashboardView />;
}
