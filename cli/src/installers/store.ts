import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import type { Installer } from "./types.js";

const ZUSTAND_STORE = `import { create } from "zustand";
import { persist } from "zustand/middleware";

type AppState = {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
};

/**
 * App-wide client store — UI / session only (not server cache).
 * Add domain fields here or split into \`src/stores/<domain>-store.ts\`.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "app-store",
      partialize: (state) => ({ hydrated: state.hydrated }),
    },
  ),
);
`;

const ZUSTAND_RULE = `---
description: Zustand client store conventions
globs: src/stores/**
alwaysApply: false
---

# Zustand

- Stores live under \`src/stores/\` (one file per domain when it grows).
- Prefer small selectors: \`useAppStore((s) => s.hydrated)\`.
- \`persist\` is OK for UI prefs; never persist secrets / tokens.
- Server Components stay free of store hooks — pass data down or use a client leaf.
- TanStack Query = server cache; Zustand = client UI/session only.
`;

const REDUX_APP_SLICE = `import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppSliceState = {
  hydrated: boolean;
};

const initialState: AppSliceState = {
  hydrated: false,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
  },
});

export const { setHydrated } = appSlice.actions;
export default appSlice.reducer;
`;

const REDUX_STORE = `import { configureStore } from "@reduxjs/toolkit";

import appReducer from "./slices/app-slice";

/** Per-request store factory (App Router / RSC-safe). */
export const makeStore = () =>
  configureStore({
    reducer: {
      app: appReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Relax when you intentionally put non-serializable values in actions.
        serializableCheck: true,
        immutableCheck: true,
      }),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
`;

const REDUX_HOOKS = `import { useDispatch, useSelector, useStore } from "react-redux";

import type { AppDispatch, AppStore, RootState } from "@/stores/store";

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
`;

const REDUX_PROVIDER = `"use client";

import { type ReactNode, useRef } from "react";
import { Provider } from "react-redux";

import { makeStore, type AppStore } from "@/stores/store";

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<AppStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }

  return <Provider store={storeRef.current}>{children}</Provider>;
}
`;

const REDUX_RULE = `---
description: Redux Toolkit client store conventions
globs: src/stores/**,src/providers/store-provider.tsx
alwaysApply: false
---

# Redux Toolkit

- Store factory: \`src/stores/store.ts\` (\`makeStore\` — one store per client tree).
- Slices: \`src/stores/slices/*-slice.ts\` (register in \`store.ts\`).
- Typed hooks: \`src/stores/hooks.ts\` (\`useAppDispatch\` / \`useAppSelector\`).
- Provider: \`src/providers/store-provider.tsx\` (via \`AppProviders\`).
- Prefer RTK slices; keep server secrets out of the client store.
- TanStack Query = server cache; Redux = client UI/session only.
`;

export const storeInstaller: Installer = {
  id: "store",
  active: (o) => o.store !== "none",
  async run({ projectDir, options }) {
    const storesDir = path.join(projectDir, "src", "stores");
    await fs.ensureDir(storesDir);

    if (options.store === "zustand") {
      await fs.writeFile(
        path.join(storesDir, "app-store.ts"),
        ZUSTAND_STORE,
        "utf8",
      );
      await fs.writeFile(
        path.join(projectDir, ".cursor", "rules", "store.mdc"),
        ZUSTAND_RULE,
        "utf8",
      );
      await fs.outputFile(
        path.join(projectDir, "docs", "style-guide", "state", "zustand.md"),
        `# Zustand

- Store: \`src/stores/app-store.ts\` (\`persist\` for UI prefs)
- Prefer selectors; split domain stores under \`src/stores/\` as the app grows
- Do not put server cache here — use TanStack Query when enabled
`,
      );
      await addDependencies(projectDir, { zustand: "^5.0.3" });
      return;
    }

    const slicesDir = path.join(storesDir, "slices");
    await fs.ensureDir(slicesDir);
    await fs.writeFile(
      path.join(slicesDir, "app-slice.ts"),
      REDUX_APP_SLICE,
      "utf8",
    );
    await fs.writeFile(path.join(storesDir, "store.ts"), REDUX_STORE, "utf8");
    await fs.writeFile(path.join(storesDir, "hooks.ts"), REDUX_HOOKS, "utf8");

    const providersDir = path.join(projectDir, "src", "providers");
    await fs.ensureDir(providersDir);
    await fs.remove(path.join(providersDir, ".gitkeep"));
    await fs.writeFile(
      path.join(providersDir, "store-provider.tsx"),
      REDUX_PROVIDER,
      "utf8",
    );

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "store.mdc"),
      REDUX_RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "state", "redux.md"),
      `# Redux Toolkit

- Store: \`src/stores/store.ts\` (\`makeStore\`)
- Slices: \`src/stores/slices/\`
- Hooks: \`src/stores/hooks.ts\`
- Provider: \`src/providers/store-provider.tsx\` (via \`AppProviders\`)
`,
    );

    await addDependencies(projectDir, {
      "@reduxjs/toolkit": "^2.5.1",
      "react-redux": "^9.2.0",
    });
  },
};
