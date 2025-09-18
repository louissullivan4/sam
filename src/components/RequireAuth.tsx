import { useEffect, useState, type ReactNode } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";
import { Navigate, useLocation } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { User } from "../types";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const [role, setRole] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const loc = useLocation();

  useEffect(() => {
    if (!user) {
      setRole(null);
      setUserLoaded(true);
      return;
    }
    const userData = doc(db, "users", user.uid);
    const unsub = onSnapshot(userData, (snap) => {
      setRole(snap.exists() ? ((snap.data() as User).role ?? null) : null);
      setUserLoaded(true);
    });
    return unsub;
  }, [user]);

  if (loading || !userLoaded) return null;

  if (!user) return <Navigate to="/signin" state={{ from: loc }} replace />;

  if (role === "pending") return <Navigate to="/pending" replace />;

  return <>{children}</>;
}
