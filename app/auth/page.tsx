import { Suspense } from "react";
import AuthClient from "./AuthClient";

export const dynamic = "force-dynamic";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6">Laden…</div>}>
      <AuthClient />
    </Suspense>
  );
}