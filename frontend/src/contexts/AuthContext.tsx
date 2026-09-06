import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

const AUTH_USER_STORAGE_KEY = "filestorageservice.authuser"

export interface AuthUser {
    name: string,
    email: string,
    authToken: string
}

export interface AuthContextType {
    isAuthenticated: boolean
    user: AuthUser | null
    setUser: (user: AuthUser)=> void
    logout: ()=> void
}

interface AuthContextProviderProps {
    children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {

    const [authUser, setAuthUser] = useState<AuthUser | null>(()=> {
        const value = localStorage.getItem(AUTH_USER_STORAGE_KEY);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value) as AuthUser
        }
        catch {
            localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        }
    });
    
    const setUser = useCallback((user: AuthUser)=> {
        // save in localStorage 
        const value = JSON.stringify(user);
        localStorage.setItem(AUTH_USER_STORAGE_KEY, value);

        // update state
        setAuthUser(user);
    }, [setAuthUser]);

    const logout = useCallback(()=> {
        // remove from localStorage
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);

        // set null in state
        setAuthUser(null);

    }, [setAuthUser]);

    return <AuthContext.Provider value={{isAuthenticated: null != authUser, user: authUser ,setUser, logout }}>
        {children}
    </AuthContext.Provider>;
};

export function useAuthContext(): AuthContextType {
   const context = useContext(AuthContext); 
   if (!context) {
    throw new Error('useAuthContext must be used within a AuthContextProvider')
  }
  return context;
}