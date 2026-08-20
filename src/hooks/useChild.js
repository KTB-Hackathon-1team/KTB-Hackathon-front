import { useContext } from "react";
import { ChildContext } from "@/context/ChildContext";

export function useChild() {
  const context = useContext(ChildContext);
  if (!context) throw new Error("useChild는 ChildProvider 안에서 사용해야 합니다.");
  return context;
}
