"use client";

import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { usePathname, useRouter } from "next/navigation";
import {
  getCurrentUser,
  type AuthUser,
} from "../lib/auth";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({
  children,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      setChecking(true);

      try {
        const response = await getCurrentUser();

        if (!response.user || !response.user.is_active) {
          throw new Error("Your account is inactive.");
        }

        if (!cancelled) {
          setUser(response.user);
        }
      } catch {
        if (!cancelled) {
          setUser(null);

          router.replace(
            `/login?next=${encodeURIComponent(pathname || "/dashboard")}`
          );
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F3F8FA] transition-colors duration-300 dark:bg-[#07151C]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#DCE8EC] border-t-[#126782] dark:border-[#1C3A45] dark:border-t-[#36B9D0]" />

          <h1 className="mt-5 text-base font-semibold text-[#102A43] dark:text-[#E8F4F7]">
            MedSearch AI
          </h1>

          <p className="mt-2 text-sm text-[#627D98] dark:text-[#8AA2AD]">
            Verifying your session...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}