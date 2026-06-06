import { Suspense } from "react";

import { LoginForm } from "./login-form";

// useSearchParams() inside LoginForm requires a Suspense boundary at the route level —
// Next 16 refuses to prerender otherwise.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
