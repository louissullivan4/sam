import type { User } from "../types";
import { doc, onSnapshot } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";

export default function useUser() {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  useEffect(() => {
    if (!user) {
      setUserData(null);
      setUserLoaded(true);
      return;
    }
    const userRef = doc(db, "users", user.uid);
    const unsub = onSnapshot(userRef, (snap) => {
      setUserData(snap.exists() ? (snap.data() as User) : null);
      setUserLoaded(true);
    });
    setUserData((prev) => (prev ? { ...prev, uid: user.uid } : null));
    return unsub;
  }, [user]);
  return { userData: userData, userLoading: loading || !userLoaded };
}
