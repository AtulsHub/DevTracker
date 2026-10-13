import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignInScreen } from "@/v2/screens/AuthScreens";
import { Skeleton } from "@/v2/components/Skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16">
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <SignInScreen />
    </Suspense>
  );
}
