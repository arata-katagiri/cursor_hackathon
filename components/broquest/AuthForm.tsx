"use client";
// BroQuest — shared login / signup form (Duo theme)
import Link from "next/link";
import { useActionState } from "react";
import type { AuthState } from "@/app/auth/actions";

type AuthAction = (prev: AuthState, formData: FormData) => Promise<AuthState>;

export default function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "signup";
  action: AuthAction;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, {});
  const isSignup = mode === "signup";

  return (
    <div className="bq-page">
      <div className="bq-app" style={{ justifyContent: "center", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 52 }}>🔥</div>
          <h1 style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 30, margin: "6px 0 2px" }}>
            BroQuest
          </h1>
          <p style={{ color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>
            {isSignup ? "Dare your friends. Keep the flame alive." : "Welcome back, legend."}
          </p>
        </div>

        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 14 }}>
          {isSignup && (
            <input
              className="qinput"
              name="display_name"
              placeholder="Display name"
              autoComplete="nickname"
              style={{ fontSize: 16 }}
            />
          )}
          <input
            className="qinput"
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            required
            style={{ fontSize: 16 }}
          />
          <input
            className="qinput"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            required
            style={{ fontSize: 16 }}
          />

          {state.error && (
            <div style={{ color: "#e23b50", fontWeight: 700, fontSize: 13.5, textAlign: "center" }}>
              {state.error}
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={pending} style={{ marginTop: 4 }}>
            {pending ? "…" : isSignup ? "Create account ✦" : "Log in"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 18, color: "var(--muted)", fontWeight: 700, fontSize: 14 }}>
          {isSignup ? "Already have an account? " : "New here? "}
          <Link href={isSignup ? "/login" : "/signup"} style={{ color: "var(--primary)", fontWeight: 800 }}>
            {isSignup ? "Log in" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}
