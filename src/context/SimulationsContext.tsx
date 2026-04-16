import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CalcInputs, CalcResults, SavedCalculation } from "../types";
import {
  loadSavedCalculations,
  saveCalculation as localSave,
  updateCalculation as localUpdate,
  deleteCalculation as localDelete,
} from "../types";
import { getSupabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type SimulationsContextValue = {
  calculations: SavedCalculation[];
  loading: boolean;
  error: string | null;
  /** True when using Supabase cloud for the active session (logged in + cloud configured). */
  usingCloud: boolean;
  refresh: () => Promise<void>;
  saveCalculation: (calc: SavedCalculation) => Promise<void>;
  updateCalculation: (calc: SavedCalculation) => Promise<void>;
  deleteCalculation: (id: string) => Promise<void>;
  /** Upload simulations currently in this browser (localStorage) to the signed-in account. */
  importLocalToCloud: () => Promise<{ imported: number; error: string | null }>;
};

const SimulationsContext = createContext<SimulationsContextValue | null>(null);

function rowToSaved(
  id: string,
  saved_at: string,
  inputs: CalcInputs,
  results: CalcResults
): SavedCalculation {
  return { id, savedAt: saved_at, inputs, results };
}

export function SimulationsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading, cloudEnabled } = useAuth();
  /** Stable key so hooks update when switching accounts (`true` alone would not). */
  const remoteKey = cloudEnabled && user ? user.id : "";
  const useRemote = Boolean(remoteKey);

  const [calculations, setCalculations] = useState<SavedCalculation[]>(() => loadSavedCalculations());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!useRemote) {
      setCalculations(loadSavedCalculations());
      setError(null);
      return;
    }
    const sb = getSupabase();
    if (!sb) {
      setCalculations([]);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: qErr } = await sb
      .from("saved_calculations")
      .select("id, saved_at, inputs, results")
      .order("saved_at", { ascending: false });
    setLoading(false);
    if (qErr) {
      setError(qErr.message);
      setCalculations([]);
      return;
    }
    const rows = (data ?? []) as {
      id: string;
      saved_at: string;
      inputs: CalcInputs;
      results: CalcResults;
    }[];
    setCalculations(
      rows.map((r) => rowToSaved(r.id, r.saved_at, r.inputs, r.results))
    );
  }, [useRemote, user]);

  useEffect(() => {
    if (!cloudEnabled) {
      void Promise.resolve().then(() => {
        setCalculations(loadSavedCalculations());
        setError(null);
      });
      return;
    }
    if (authLoading) return;
    void Promise.resolve().then(() => {
      void refresh();
    });
  }, [cloudEnabled, remoteKey, authLoading, refresh]);

  const saveCalculation = useCallback(
    async (calc: SavedCalculation) => {
      if (!useRemote) {
        localSave(calc);
        setCalculations(loadSavedCalculations());
        return;
      }
      const sb = getSupabase();
      if (!sb) throw new Error("Supabase tidak tersedia");
      const { error: upErr } = await sb.from("saved_calculations").upsert(
        {
          user_id: user!.id,
          id: calc.id,
          saved_at: calc.savedAt,
          inputs: calc.inputs,
          results: calc.results,
        },
        { onConflict: "user_id,id" }
      );
      if (upErr) {
        setError(upErr.message);
        throw upErr;
      }
      await refresh();
    },
    [useRemote, user, refresh]
  );

  const updateCalculation = useCallback(
    async (calc: SavedCalculation) => {
      if (!useRemote) {
        localUpdate(calc);
        setCalculations(loadSavedCalculations());
        return;
      }
      const sb = getSupabase();
      if (!sb) throw new Error("Supabase tidak tersedia");
      const { error: upErr } = await sb.from("saved_calculations").upsert(
        {
          user_id: user!.id,
          id: calc.id,
          saved_at: calc.savedAt,
          inputs: calc.inputs,
          results: calc.results,
        },
        { onConflict: "user_id,id" }
      );
      if (upErr) {
        setError(upErr.message);
        throw upErr;
      }
      await refresh();
    },
    [useRemote, user, refresh]
  );

  const deleteCalculation = useCallback(
    async (id: string) => {
      if (!useRemote) {
        localDelete(id);
        setCalculations(loadSavedCalculations());
        return;
      }
      const sb = getSupabase();
      if (!sb) throw new Error("Supabase tidak tersedia");
      const { error: delErr } = await sb.from("saved_calculations").delete().eq("id", id);
      if (delErr) {
        setError(delErr.message);
        throw delErr;
      }
      await refresh();
    },
    [useRemote, user, refresh]
  );

  const importLocalToCloud = useCallback(async () => {
    if (!cloudEnabled || !user) {
      return { imported: 0, error: "Masuk dengan akun terlebih dahulu untuk mengimpor ke cloud." };
    }
    const local = loadSavedCalculations();
    if (local.length === 0) return { imported: 0, error: null };
    const sb = getSupabase();
    if (!sb) return { imported: 0, error: "Supabase tidak tersedia" };
    const rows = local.map((c) => ({
      user_id: user.id,
      id: c.id,
      saved_at: c.savedAt,
      inputs: c.inputs,
      results: c.results,
    }));
    const { error: upErr } = await sb.from("saved_calculations").upsert(rows, {
      onConflict: "user_id,id",
    });
    if (upErr) return { imported: 0, error: upErr.message };
    await refresh();
    return { imported: local.length, error: null };
  }, [cloudEnabled, user, refresh]);

  const value = useMemo(
    () => ({
      calculations,
      loading,
      error,
      usingCloud: useRemote,
      refresh,
      saveCalculation,
      updateCalculation,
      deleteCalculation,
      importLocalToCloud,
    }),
    [
      calculations,
      loading,
      error,
      useRemote,
      refresh,
      saveCalculation,
      updateCalculation,
      deleteCalculation,
      importLocalToCloud,
    ]
  );

  return (
    <SimulationsContext.Provider value={value}>{children}</SimulationsContext.Provider>
  );
}

export function useSimulations(): SimulationsContextValue {
  const ctx = useContext(SimulationsContext);
  if (!ctx) throw new Error("useSimulations must be used within SimulationsProvider");
  return ctx;
}
