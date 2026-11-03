"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

/* ===============================================================
   LOGO PATHS
=============================================================== */

const LOGO_LIGHT = "/images/medsearch-ai-logo-horizontal.png";
const LOGO_DARK = "/images/medsearch-ai-logo-horizontal-dark.png";

const APP_ICON_LIGHT = "/images/medsearch-ai-app-icon.png";
const APP_ICON_DARK = "/images/medsearch-ai-app-icon-dark.png";

/* ===============================================================
   AI CHIP ICON
=============================================================== */

function AIChipIcon({ active = false }: { active?: boolean }) {
  const color = active ? "#36B9D0" : "#627D98";

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="6"
        y="6"
        width="12"
        height="12"
        rx="2.5"
        stroke={color}
        strokeWidth="1.6"
      />
      <rect
        x="9"
        y="9"
        width="6"
        height="6"
        rx="1.2"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="1.3"
      />
      <path
        d="M9 3V6M15 3V6M9 18V21M15 18V21M3 9H6M3 15H6M18 9H21M18 15H21"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M19.5 2L20.1 3.9L22 4.5L20.1 5.1L19.5 7L18.9 5.1L17 4.5L18.9 3.9Z"
        fill={color}
      />
    </svg>
  );
}

/* ===============================================================
   GENERAL ICONS
=============================================================== */

function Icon({
  type,
  active = false,
}: {
  type: string;
  active?: boolean;
}) {
  const color = active ? "#36B9D0" : "#627D98";

  const common = {
    width: 21,
    height: 21,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case "dashboard":
      return (
        <svg {...common} aria-hidden="true">
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.2" />
        </svg>
      );

    case "reports":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M6 3.5h8.5L19 8v12.5H6z" />
          <path d="M14.5 3.5V8H19" />
          <path d="M9 13h6" />
          <path d="M9 17h4.5" />
        </svg>
      );

    case "comparison":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 6h14" />
          <path d="M5 12h14" />
          <path d="M5 18h14" />
          <circle cx="9" cy="6" r="2" fill={color} stroke="none" />
          <circle cx="15" cy="12" r="2" fill={color} stroke="none" />
          <circle cx="10" cy="18" r="2" fill={color} stroke="none" />
        </svg>
      );

    case "search":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
      );

    case "documents":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M5 3.5h9.5L19 8v12.5H5z" />
          <path d="M14.5 3.5V8H19" />
          <path d="M8.5 13h7" />
          <path d="M8.5 17h5" />
        </svg>
      );

    case "analytics":
      return (
        <svg {...common} aria-hidden="true">
          <path d="M4 20V4" />
          <path d="M4 20h17" />
          <path d="m7 15 4-4 3 2 5-7" />
        </svg>
      );

    case "settings":
      return (
        <svg
          width="23"
          height="23"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98L14.5 2.42C14.47 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.5.42L9.12 5.07c-.61.25-1.18.59-1.69.98l-2.49-1c-.23-.08-.48 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.61-.25 1.18-.59 1.69-.98l2.49 1c.23-.08.48 0 .6.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65Z"
            stroke={color}
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="12"
            r="3.2"
            stroke={color}
            strokeWidth="1.7"
          />
        </svg>
      );

    case "help":
      return (
        <svg {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9a2.35 2.35 0 1 1 4.4 1.3c-.7.9-2.2 1.2-2.2 2.7" />
          <path d="M12 16.5h.01" />
        </svg>
      );

    default:
      return null;
  }
}

/* ===============================================================
   NAVIGATION
=============================================================== */

const mainNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Ask AI", href: "/workspace", icon: "ai" },
  { label: "Reports", href: "/reports", icon: "reports" },
  {
    label: "Report Comparison",
    href: "/report-comparison",
    icon: "comparison",
  },
  { label: "Medical Search", href: "/search", icon: "search" },
  { label: "Documents", href: "/documents", icon: "documents" },
  { label: "Analytics", href: "/analytics", icon: "analytics" },
];

const bottomNavigation = [
  { label: "Settings", href: "/settings", icon: "settings" },
  { label: "Help & Safety", href: "/help", icon: "help" },
];

/* ===============================================================
   THEME-AWARE IMAGE
=============================================================== */

function ThemeLogo({
  src,
  fallbackSrc,
  alt,
  width,
  height,
  className,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className: string;
}) {
  const [imageSrc, setImageSrc] = useState(src);

  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  return (
    <Image
      key={imageSrc}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      priority
      unoptimized
      onError={() => {
        if (imageSrc !== fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
      }}
      className={className}
    />
  );
}

/* ===============================================================
   SIDEBAR
=============================================================== */

export default function Sidebar({
  collapsed,
  onToggle,
}: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  const horizontalLogo = isDark ? LOGO_DARK : LOGO_LIGHT;
  const appIcon = isDark ? APP_ICON_DARK : APP_ICON_LIGHT;

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        flex h-dvh flex-col
        border-r border-[#DCE8EC] bg-white
        transition-[width] duration-300
        dark:border-[#1C3A45] dark:bg-[#091A22]
        ${collapsed ? "w-[80px]" : "w-[230px]"}
      `}
    >
      {/* LOGO HEADER */}

      <div
        className="
          relative z-10 flex h-[76px] min-h-[76px] w-full
          shrink-0 items-center justify-center
          border-b border-[#DCE8EC] bg-white
          dark:border-[#1C3A45] dark:bg-[#091A22]
        "
      >
        {collapsed ? (
          <Link
            href="/dashboard"
            aria-label="MedSearch AI dashboard"
            title="MedSearch AI"
            className="
              flex h-full w-full shrink-0
              items-center justify-center
              overflow-hidden
            "
          >
            <ThemeLogo
              src={appIcon}
              fallbackSrc={APP_ICON_LIGHT}
              alt="MedSearch AI"
              width={48}
              height={48}
              className="block h-10 w-10 shrink-0 object-contain"
            />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            aria-label="MedSearch AI dashboard"
            title="MedSearch AI"
            className="
              flex h-full w-full min-w-0
              items-center justify-center
              overflow-hidden px-2
            "
          >
            <ThemeLogo
              src={horizontalLogo}
              fallbackSrc={LOGO_LIGHT}
              alt="MedSearch AI — Smart Health Knowledge Assistant"
              width={300}
              height={90}
              className="
                block h-auto w-full max-w-[210px]
                shrink-0 object-contain
              "
            />
          </Link>
        )}
      </div>

      {/* COLLAPSE BUTTON */}

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="
          absolute -right-3 top-[88px] z-20
          flex h-6 w-6 items-center justify-center
          rounded-full border border-[#DCE8EC] bg-white
          text-[#627D98] shadow-sm transition
          hover:text-[#126782]
          dark:border-[#1C3A45] dark:bg-[#0D2029]
          dark:text-[#8AA2AD] dark:hover:text-[#36B9D0]
        "
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {collapsed ? (
            <path d="m9 18 6-6-6-6" />
          ) : (
            <path d="m15 18-6-6 6-6" />
          )}
        </svg>
      </button>

      {/* MAIN NAVIGATION */}

      <nav className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-6">
        {!collapsed && (
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B1] dark:text-[#607984]">
            Workspace
          </div>
        )}

        <div className="space-y-1">
          {mainNavigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`
                  group flex h-11 items-center rounded-xl
                  transition-all duration-200
                  ${collapsed ? "justify-center" : "gap-3 px-3"}
                  ${
                    active
                      ? "bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]"
                      : "text-[#627D98] hover:bg-[#F3F8FA] hover:text-[#126782] dark:text-[#8AA2AD] dark:hover:bg-[#0D2029] dark:hover:text-[#36B9D0]"
                  }
                `}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                  {item.icon === "ai" ? (
                    <AIChipIcon active={active} />
                  ) : (
                    <Icon type={item.icon} active={active} />
                  )}
                </div>

                {!collapsed && (
                  <span
                    className={`truncate text-[13px] ${
                      active ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                )}

                {!collapsed && active && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#36B9D0]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* BOTTOM AREA */}

      <div className="shrink-0 border-t border-[#DCE8EC] px-3 py-4 dark:border-[#1C3A45]">
        {!collapsed && (
          <div className="mb-4">
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8AA0B1] dark:text-[#607984]">
              Appearance
            </div>

            <div
              className="
                flex items-center justify-between rounded-xl
                border border-[#DCE8EC] bg-[#F7FAFB] px-3 py-2.5
                dark:border-[#1C3A45] dark:bg-[#0D2029]
              "
            >
              <span className="text-[12px] font-medium text-[#627D98] dark:text-[#8AA2AD]">
                Theme
              </span>

              <button
                type="button"
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
                aria-pressed={isDark}
                className={`
                  relative h-6 w-11 shrink-0 rounded-full border
                  transition-all duration-300 ease-out
                  ${
                    isDark
                      ? "border-[#285565] bg-[#123B49]"
                      : "border-[#DCE8EC] bg-[#E7EEF1]"
                  }
                `}
              >
                <span
                  className={`
                    absolute top-0.5 flex h-5 w-5 items-center justify-center
                    rounded-full bg-white shadow-[0_2px_5px_rgba(0,0,0,0.16)]
                    transition-all duration-300 ease-out
                    ${isDark ? "left-[21px]" : "left-0.5"}
                  `}
                >
                  {isDark ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#36B9D0"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.7 6.7 0 0 0 21 12.8Z" />
                    </svg>
                  ) : (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#126782"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="4" />
                      <path d="M12 2v2" />
                      <path d="M12 20v2" />
                      <path d="m4.93 4.93 1.41 1.41" />
                      <path d="m17.66 17.66 1.41 1.41" />
                      <path d="M2 12h2" />
                      <path d="M20 12h2" />
                      <path d="m6.34 17.66-1.41 1.41" />
                      <path d="m19.07 4.93-1.41-1.41" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* SETTINGS + HELP */}

        <div className="space-y-1">
          {bottomNavigation.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                className={`
                  flex h-11 items-center rounded-xl transition-all duration-200
                  ${collapsed ? "justify-center" : "gap-3 px-3"}
                  ${
                    active
                      ? "bg-[#E8F7FA] text-[#126782] dark:bg-[#10333E] dark:text-[#36B9D0]"
                      : "text-[#627D98] hover:bg-[#F3F8FA] hover:text-[#126782] dark:text-[#8AA2AD] dark:hover:bg-[#0D2029] dark:hover:text-[#36B9D0]"
                  }
                `}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  <Icon type={item.icon} active={active} />
                </div>

                {!collapsed && (
                  <span
                    className={`text-[13px] ${
                      active ? "font-semibold" : "font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* USER PROFILE */}

        <div
          className={`
            mt-4 flex items-center rounded-xl
            bg-[#F7FAFB] dark:bg-[#0D2029]
            ${collapsed ? "justify-center p-2" : "gap-3 p-3"}
          `}
        >
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-full bg-[#126782] text-[12px] font-semibold text-white
              dark:bg-[#17677D]
            "
          >
            HS
          </div>

          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[12px] font-semibold text-[#102A43] dark:text-[#E8F4F7]">
                Hasil
              </div>

              <div className="truncate text-[10px] text-[#627D98] dark:text-[#8AA2AD]">
                Personal workspace
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}