import { auth, db } from "@/libs/firebase";
import { apiFetch } from "@/libs/api";
import { User } from "@/types/user";
import { doc, getDoc, setDoc } from "@firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// ログイン中はUser, ログインしてないときはnull, ローディング中はundefined
type UserContextType = User | null | undefined;
const AuthContext = createContext<UserContextType>(undefined);

async function checkAuth(): Promise<boolean> {
  const response = await apiFetch("/api/check_auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (response.status === 403) return false;
  if (!response.ok) {
    throw new Error(
      response.status === 500
        ? "認証サーバーの設定に問題があります。管理者に確認してください。"
        : response.status === 401
          ? "ログイン情報を確認できませんでした。もう一度ログインしてください。"
          : "認証サーバーに接続できませんでした。しばらくしてから再度お試しください。"
    );
  }

  const data = await response.json();

  return data.isAllowed;
}

// childrenを受け取り、ラップされたすべての要素に認証情報を付与する
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserContextType>();

  useEffect(() => {
    let active = true;
    let generation = 0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const currentGeneration = ++generation;
      const isCurrent = () => active && generation === currentGeneration &&
        auth.currentUser === firebaseUser;
      if (!active) return;
      setUser(undefined);
      if (firebaseUser) {
        const email = firebaseUser.email ?? "";

        try {
          if (email) {
            const isAllowed = await checkAuth();
            if (!isCurrent()) return;
            if (!isAllowed) {
              alert(
                "アクセスが拒否されました。許可されたユーザのみがアクセスできます。"
              );
              setUser(null);
              await signOut(auth);
              return;
            }
          } else {
            console.error("Email is null or empty.");
            setUser(null);
            await signOut(auth);
            return;
          }

          const ref = doc(db, `users/${firebaseUser.uid}`); // ログインしたユーザ情報
          const snap = await getDoc(ref); // 非同期処理でユーザのドキュメント内容を取得
          if (!isCurrent()) return;

          if (snap.exists()) {
            const appUser = snap.data() as User;
            setUser(appUser);
          } else {
            // ドキュメントに存在していないユーザの場合はFirestoreにユーザ情報を保存
            const appUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "No Name",
            };
            await setDoc(ref, appUser);
            if (!isCurrent()) return;
            setUser(appUser);
          }
        } catch (error) {
          if (!isCurrent()) return;
          console.error("認証チェック中にエラーが発生しました", error);
          setUser(null);
          alert(error instanceof Error ? error.message : "ログイン処理に失敗しました。再度お試しください。");
        }
      } else {
        // ログアウト時はユーザ情報を初期化
        setUser(null);
      }
    });
    return () => {
      active = false;
      generation++;
      unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
