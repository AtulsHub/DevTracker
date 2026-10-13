import { redirect } from "next/navigation";

/** Activity feed folded into Dashboard in v2. */
export default function ActivityRedirect() {
  redirect("/dashboard");
}
