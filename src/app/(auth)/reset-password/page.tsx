import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordScreen } from "@/v2/screens/PasswordScreens";
import { Skeleton } from "@/v2/components/Skeleton";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16">
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <ResetPasswordScreen />
    </Suspense>
  );
}
