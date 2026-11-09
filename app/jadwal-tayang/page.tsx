import { redirect } from "next/navigation";
import { getTodayDate } from "@/lib/repository";

export default async function ScheduleIndexPage() {
  const today = await getTodayDate();
  redirect(`/jadwal-tayang/${today}`);
}
