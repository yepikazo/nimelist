import { redirect } from "next/navigation";
import { getJakartaToday } from "@/lib/service-clients";

export default function ScheduleIndexPage() {
  const today = getJakartaToday();
  redirect(`/jadwal-tayang/${today}`);
}
