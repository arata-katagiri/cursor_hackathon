import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { signup } from "@/app/auth/actions";
import AuthForm from "@/components/broquest/AuthForm";
import "@/app/broquest.css";

export default async function SignupPage() {
  if (await getUser()) redirect("/app");
  return <AuthForm mode="signup" action={signup} />;
}
