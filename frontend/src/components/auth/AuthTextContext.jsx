import { createContext, useContext } from "react";

export const AuthTextContext = createContext((key) => key);

export function useAuthText() {
  return useContext(AuthTextContext);
}
