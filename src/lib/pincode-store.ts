import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PincodeState {
  pincode: string | null;
  setPincode: (p: string | null) => void;
}

export const usePincodeStore = create<PincodeState>()(
  persist(
    (set) => ({
      pincode: null,
      setPincode: (p) => set({ pincode: p && /^\d{6}$/.test(p) ? p : null }),
    }),
    { name: "maati-pincode" },
  ),
);

// SSR-safe wrapper: only return persisted value after hydration to avoid mismatch.
export function usePincode() {
  const value = usePincodeStore((s) => s.pincode);
  const set = usePincodeStore((s) => s.setPincode);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return { pincode: ready ? value : null, setPincode: set, ready };
}

export function isValidPincode(p: string): boolean {
  return /^\d{6}$/.test(p);
}
