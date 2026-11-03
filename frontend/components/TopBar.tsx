"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/workspace": "Ask AI",
  "/reports": "My Reports",
  "/search": "Knowledge Search",
  "/documents": "Documents",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/help": "Help & Support",
};

export default function TopBar() {
  const pathname = usePathname();
  const { theme } = useTheme();

  const title =
    pageTitles[pathname] ||
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(`${path}/`)
    )?.[1] ||
    "MedSearch AI";

  const logoSrc =
    theme === "dark"
      ? "/images/medsearch-ai-logo-compact-dark.png"
      : "/images/medsearch-ai-logo-compact.png";

  return (
    <header
      className="
        sticky top-0 z-40
        flex h-[72px] items-center justify-between
        border-b border-[#DCE8EC]
        bg-white/95
        px-5 backdrop-blur
        transition-all duration-500
        dark:border-[#1C3A45]
        dark:bg-[#091A22]/95
        sm:px-8
      "
    >
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-4">
        {/* Mobile brand */}
        <Link
          href="/dashboard"
          aria-label="MedSearch AI dashboard"
          title="MedSearch AI"
          className="flex shrink-0 items-center lg:hidden"
        >
          <Image
            src={logoSrc}
            alt="MedSearch AI"
            width={160}
            height={48}
            priority
            sizes="160px"
            className="
              h-auto max-h-10 w-auto max-w-[160px]
              object-contain
            "
          />
        </Link>

        {/* Page title */}
        <div className="hidden min-w-0 lg:block">
          <div className="flex items-center gap-2">
            <span
              className="
                h-1.5 w-1.5 rounded-full
                bg-[#20A779]
                shadow-[0_0_6px_rgba(32,167,121,0.25)]
              "
            />

            <span
              className="
                text-[10px] font-semibold uppercase
                tracking-[0.16em]
                text-[#8AA2AD]
                transition-colors duration-500
                dark:text-[#62808B]
              "
            >
              Workspace
            </span>
          </div>

          <h1
            className="
              mt-0.5 truncate
              text-[17px] font-semibold tracking-tight
              text-[#102A43]
              transition-colors duration-500
              dark:text-[#E8F4F7]
            "
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Desktop search */}
        <button
          type="button"
          aria-label="Search anything"
          className="
            hidden h-10 w-[230px]
            items-center gap-2.5
            rounded-xl
            border border-[#DCE8EC]
            bg-[#F7FAFB]
            px-3
            text-left
            transition-all duration-300
            hover:border-[#B9D9E1]
            hover:bg-white
            lg:flex
            dark:border-[#1C3A45]
            dark:bg-[#0D2029]
            dark:hover:border-[#286174]
            dark:hover:bg-[#102A32]
          "
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="text-[#78909C] dark:text-[#62808B]"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>

          <span
            className="
              flex-1 text-xs
              text-[#8AA2AD]
              dark:text-[#6F919D]
            "
          >
            Search anything...
          </span>

          <span
            className="
              rounded-md
              border border-[#DCE8EC]
              bg-white
              px-1.5 py-0.5
              text-[9px] font-medium
              text-[#8AA2AD]
              dark:border-[#1C3A45]
              dark:bg-[#122C36]
              dark:text-[#6F919D]
            "
          >
            ⌘ K
          </span>
        </button>

        {/* Mobile search */}
        <button
          type="button"
          aria-label="Search"
          className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-[#DCE8EC]
            bg-white
            text-[#627D98]
            transition-all duration-300
            hover:bg-[#F7FAFB]
            lg:hidden
            dark:border-[#1C3A45]
            dark:bg-[#0D2029]
            dark:text-[#78909C]
            dark:hover:bg-[#102A32]
            dark:hover:text-[#36B9D0]
          "
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </button>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="
            relative flex h-10 w-10
            items-center justify-center
            rounded-xl
            border border-[#DCE8EC]
            bg-white
            text-[#627D98]
            transition-all duration-300
            hover:bg-[#F7FAFB]
            hover:text-[#126782]
            dark:border-[#1C3A45]
            dark:bg-[#0D2029]
            dark:text-[#78909C]
            dark:hover:border-[#286174]
            dark:hover:bg-[#102A32]
            dark:hover:text-[#36B9D0]
          "
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
          </svg>

          <span
            className="
              absolute right-2 top-1.5
              h-1.5 w-1.5 rounded-full
              bg-[#E45858]
              shadow-[0_0_5px_rgba(228,88,88,0.35)]
            "
          />
        </button>

        {/* Divider */}
        <div
          className="
            hidden h-8 w-px
            bg-[#DCE8EC]
            transition-colors duration-500
            dark:bg-[#1C3A45]
            sm:block
          "
        />

        {/* Profile */}
        <button
          type="button"
          aria-label="User profile"
          className="
            flex items-center gap-2.5
            rounded-xl
            px-1.5 py-1.5
            transition-all duration-300
            hover:bg-[#F7FAFB]
            dark:hover:bg-[#0D2029]
          "
        >
          {/* Avatar */}
          <div
            className="
              flex h-9 w-9
              shrink-0 items-center justify-center
              rounded-full
              bg-[#E5F3F6]
              text-xs font-bold
              text-[#126782]
              transition-all duration-500
              dark:bg-[#12313C]
              dark:text-[#36B9D0]
              dark:shadow-[0_0_14px_rgba(54,185,208,0.10)]
            "
          >
            HS
          </div>

          {/* User information */}
          <div className="hidden text-left md:block">
            <p
              className="
                text-xs font-semibold leading-4
                text-[#102A43]
                transition-colors duration-500
                dark:text-[#E8F4F7]
              "
            >
              MedSearch User
            </p>

            <p
              className="
                text-[10px] leading-4
                text-[#8AA2AD]
                transition-colors duration-500
                dark:text-[#6F919D]
              "
            >
              Personal workspace
            </p>
          </div>

          {/* Dropdown arrow */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="
              hidden text-[#78909C]
              transition-colors duration-300
              dark:text-[#62808B]
              md:block
            "
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>
    </header>
  );
}