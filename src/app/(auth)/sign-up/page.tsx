import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SignUpScreen } from "@/v2/screens/AuthScreens";

export const metadata: Metadata = {
  title: "Sign up",
};

export default async function SignUpPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/dashboard");
  return <SignUpScreen />;
}
