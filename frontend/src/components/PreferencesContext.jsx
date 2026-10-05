import { createContext, useContext } from "react";

export const PreferencesContext = createContext(null);

export function useAppPreferences() {
  return useContext(PreferencesContext);
}
