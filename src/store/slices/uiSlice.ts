import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
}

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: "light",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setTheme(state, action: PayloadAction<"light" | "dark">) {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setSidebarOpen, toggleSidebarCollapsed, setTheme } =
  uiSlice.actions;

export default uiSlice.reducer;
