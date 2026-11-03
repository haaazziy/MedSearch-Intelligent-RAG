"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({
  children,
}: AppShellProps) {
  // =========================================================
  // SIDEBAR STATE
  // =========================================================

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  // =========================================================
  // RESTORE SAVED THEME
  // =========================================================

  useEffect(() => {
    const savedTheme =
      localStorage.getItem("medsearch-theme");

    const shouldUseDark =
      savedTheme === "dark";

    document.documentElement.classList.toggle(
      "dark",
      shouldUseDark
    );
  }, []);

  return (
    <div
      className="
        min-h-screen
        bg-[#F3F8FA]
        text-[#102A43]
        transition-colors
        duration-500
        dark:bg-[#07151C]
        dark:text-[#E8F4F7]
      "
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() =>
          setSidebarCollapsed(
            (previous) => !previous
          )
        }
      />

      {/* =====================================================
          MAIN APPLICATION
      ===================================================== */}

      <div
        className={`
          min-h-screen
          transition-all
          duration-300
          ${
            sidebarCollapsed
              ? "pl-[80px]"
              : "pl-[230px]"
          }
        `}
      >
        {/* ===================================================
            TOP BAR
        =================================================== */}

        <div
          className={`
            transition-all
            duration-300
            ${
              sidebarCollapsed
                ? "ml-0"
                : "ml-0"
            }
          `}
        >
          <TopBar />
        </div>

        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <main
          className="
            min-h-[calc(100vh-76px)]
            transition-all
            duration-300
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}