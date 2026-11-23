import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

async function HomeRedirect() {
  await connection();
  const user = await getCurrentUser();
  if (user) {
    return redirect("/dashboard");
  }
  return redirect("/login");
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC]" />}>
      <HomeRedirect />
    </Suspense>
  );
}
