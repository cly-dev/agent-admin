import { createContext, useContext, useMemo, type FC, type ReactNode } from "react";
import type { FlowTriggerType } from "@/types";

export interface FlowEditorProgramContextValue {
  flowProgramTriggerType?: FlowTriggerType | string | null;
}

const FlowEditorProgramContext = createContext<FlowEditorProgramContextValue>({});

export const FlowEditorProgramProvider: FC<{
  children: ReactNode;
  flowProgramTriggerType?: FlowTriggerType | string | null;
}> = ({ children, flowProgramTriggerType }) => {
  const value = useMemo(
    () => ({ flowProgramTriggerType }),
    [flowProgramTriggerType],
  );
  return (
    <FlowEditorProgramContext.Provider value={value}>
      {children}
    </FlowEditorProgramContext.Provider>
  );
};

export function useFlowEditorProgram(): FlowEditorProgramContextValue {
  return useContext(FlowEditorProgramContext);
}
