import fs from "fs-extra";
import path from "node:path";

import { addDependencies } from "../helpers/package-json.js";
import { wrapLayoutMain } from "../helpers/wrap-layout.js";
import type { Installer } from "./types.js";

const ZUSTAND_STORE = `import { create } from "zustand";

type AppState = {
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
};

/** App-wide client store — extend slices as the product grows. */
export const useAppStore = create<AppState>((set) => ({
  hydrated: false,
  setHydrated: (value) => set({ hydrated: value }),
}));
`;

const ZUSTAND_RULE = `---
description: Zustand client store conventions
globs: src/stores/**
alwaysApply: false
---

# Zustand

- Stores live under \`src/stores/\` (one file per domain slice when possible).
- Prefer small selectors: \`useAppStore((s) => s.hydrated)\`.
- Do not put server secrets or tokens in the client store.
- Server Components stay free of store hooks — pass data down or use a client leaf.
`;

const REDUX_STORE = `import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AppSliceState = {
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

export const makeStore = () =>
  configureStore({
    reducer: {
      app: appSlice.reducer,
    },
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

- Store factory: \`src/stores/store.ts\` (\`makeStore\`).
- Typed hooks: \`src/stores/hooks.ts\` (\`useAppDispatch\` / \`useAppSelector\`).
- Provider: \`src/providers/store-provider.tsx\` wraps the root layout.
- Prefer RTK slices; keep server secrets out of the client store.
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

- Store: \`src/stores/app-store.ts\`
- Extend with domain slices under \`src/stores/\`
`,
      );
      await addDependencies(projectDir, { zustand: "^5.0.3" });
      return;
    }

    // redux
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

    const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
    let layout = await fs.readFile(layoutPath, "utf8");
    layout = wrapLayoutMain(layout, {
      importStatement:
        'import { StoreProvider } from "@/providers/store-provider";',
      providerName: "StoreProvider",
    });
    await fs.writeFile(layoutPath, layout, "utf8");

    await fs.writeFile(
      path.join(projectDir, ".cursor", "rules", "store.mdc"),
      REDUX_RULE,
      "utf8",
    );
    await fs.outputFile(
      path.join(projectDir, "docs", "style-guide", "state", "redux.md"),
      `# Redux Toolkit

- Store: \`src/stores/store.ts\`
- Hooks: \`src/stores/hooks.ts\`
- Provider: \`src/providers/store-provider.tsx\`
`,
    );

    await addDependencies(projectDir, {
      "@reduxjs/toolkit": "^2.5.1",
      "react-redux": "^9.2.0",
    });
  },
};
