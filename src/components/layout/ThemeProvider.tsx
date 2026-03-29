"use client";

import { useAppSelector } from "@/store/hooks";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useAppSelector((state) => state.ui.theme);

  return <div data-theme={theme}>{children}</div>;
}
