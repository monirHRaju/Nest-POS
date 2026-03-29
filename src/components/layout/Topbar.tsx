"use client";

import { signOut } from "next-auth/react";
import { useAppDispatch } from "@/store/hooks";
import { toggleSidebar, setTheme } from "@/store/slices/uiSlice";
import { useCurrentSession } from "@/lib/hooks/useSession";
import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function Topbar() {
  const dispatch = useAppDispatch();
  const { user } = useCurrentSession();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-20 h-16 bg-base-100 border-b border-base-300 flex items-center justify-between px-4">
      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="btn btn-ghost btn-sm btn-square lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="hidden sm:flex flex-col">
          <span className="text-xs text-base-content/60">
            {format(currentTime, "EEEE, MMMM d, yyyy")}
          </span>
          <span className="text-sm font-medium">
            {format(currentTime, "hh:mm:ss a")}
          </span>
        </div>
      </div>

      {/* Center: quick nav links */}
      <div className="hidden md:flex items-center gap-2">
        <a href="/" className="btn btn-sm btn-info">
          Dashboard
        </a>
        <a href="/reports/quantity-alerts" className="btn btn-sm btn-warning">
          Alerts
        </a>
        <a href="/pos" className="btn btn-sm btn-error">
          POS
        </a>
        <a href="/reports/profit-loss" className="btn btn-sm btn-success">
          Profit & Loss
        </a>
      </div>

      {/* Right: theme + user */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <label className="swap swap-rotate btn btn-ghost btn-sm btn-square">
          <input
            type="checkbox"
            onChange={(e) =>
              dispatch(setTheme(e.target.checked ? "dark" : "light"))
            }
          />
          {/* Sun icon */}
          <svg
            className="swap-off h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          {/* Moon icon */}
          <svg
            className="swap-on h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </label>

        {/* User dropdown */}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm gap-2"
          >
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content w-8 rounded-full">
                <span className="text-xs">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <span className="hidden sm:inline text-sm">
              {user?.firstName} {user?.lastName}
            </span>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-lg border border-base-300"
          >
            <li className="menu-title text-xs">
              {user?.role}
            </li>
            <li>
              <a href="/settings/system">Settings</a>
            </li>
            <li>
              <button onClick={() => signOut({ callbackUrl: "/login" })}>
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
