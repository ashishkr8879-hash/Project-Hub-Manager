import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "admin" | "editor";

interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  editorId?: string;
}

interface AppContextType {
  currentUser: AppUser | null;
  setCurrentUser: (user: AppUser | null) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType>({
  currentUser: null,
  setCurrentUser: () => {},
  isLoading: true,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("currentUser")
      .then((data) => {
        if (data) setCurrentUserState(JSON.parse(data));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setCurrentUser = useCallback((user: AppUser | null) => {
    setCurrentUserState(user);
    if (user) {
      AsyncStorage.setItem("currentUser", JSON.stringify(user));
    } else {
      AsyncStorage.removeItem("currentUser");
    }
  }, []);

  return (
    <AppContext.Provider value={{ currentUser, setCurrentUser, isLoading }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
