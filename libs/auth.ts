import {
  GoogleAuthProvider,
  signInWithPopup,
  UserCredential,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

// ログイン時はGoogleAuthProviderを用いた認証ポップアップを表示
export const login = (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// 現在クライアント側で認証されているユーザをログアウト、空情報を返却しログアウトを完了させる
export const logout = (): Promise<void> => {
  return signOut(auth);
};
