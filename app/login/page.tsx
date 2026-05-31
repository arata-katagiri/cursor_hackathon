import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { login } from "@/app/auth/actions";
import AuthForm from "@/components/broquest/AuthForm";
import "@/app/broquest.css";

export default async function LoginPage() {
  if (await getUser()) redirect("/app");
  return <AuthForm mode="login" action={login} />;
}
