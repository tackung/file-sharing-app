import { auth, db } from "@/libs/firebase";
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

async function checkAuth(email: string): Promise<boolean> {
  const response = await fetch("/api/check_auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    throw new Error("Failed to check auth");
  }

  const data = await response.json();

  console.log(data);
  return data.isAllowed;
}

// childrenを受け取り、ラップされたすべての要素に認証情報を付与する
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserContextType>();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email ?? "";

        try {
          if (email) {
            const isAllowed = await checkAuth(email);
            if (!isAllowed) {
              console.log(`${email} is not an allowed email, signing out.`);
              alert(
                "アクセスが拒否されました。許可されたユーザのみがアクセスできます。"
              );
              await signOut(auth);
              setUser(null);
              return;
            }
          } else {
            console.error("Email is null or empty.");
            return;
          }

          const ref = doc(db, `users/${firebaseUser.uid}`); // ログインしたユーザ情報
          const snap = await getDoc(ref); // 非同期処理でユーザのドキュメント内容を取得

          if (snap.exists()) {
            const appUser = (await getDoc(ref)).data() as User;
            setUser(appUser);
          } else {
            // ドキュメントに存在していないユーザの場合はFirestoreにユーザ情報を保存
            const appUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || "No Name",
            };
            await setDoc(ref, appUser);
            setUser(appUser);
          }
        } catch (error) {
          console.error("認証チェック中にエラーが発生しました", error);
          setUser(null);
        }
      } else {
        // ログアウト時はユーザ情報を初期化
        setUser(null);
      }

      return unsubscribe;
    });
  }, []);

  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
