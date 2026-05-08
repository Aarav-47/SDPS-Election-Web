import { createContext, useContext, useState } from "react";

const VoteContext = createContext(null);

export const VoteProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [selections, setSelections] = useState({});
  const [stepIndex, setStepIndex] = useState(0);

  const reset = () => {
    setStudent(null);
    setSelections({});
    setStepIndex(0);
  };

  return (
    <VoteContext.Provider
      value={{ student, setStudent, selections, setSelections, stepIndex, setStepIndex, reset }}
    >
      {children}
    </VoteContext.Provider>
  );
};

export const useVote = () => {
  const ctx = useContext(VoteContext);
  if (!ctx) throw new Error("useVote must be inside VoteProvider");
  return ctx;
};
