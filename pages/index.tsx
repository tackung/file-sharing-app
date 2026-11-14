import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/auth";
import { login } from "@/libs/auth";
import tenant from "@/libs/tenant";
import LoginButton from "@/components/LoginButton";
import styles from "@/styles/LoginPage.module.css";

const LoginPage = () => {
  const user = useAuth();
  const router = useRouter();

  const [waiting, setWaiting] = useState<boolean>(false);

  const signIn = () => {
    setWaiting(true);

    login()
      .catch((error) => {
        console.error(error?.code);
      })
      .finally(() => {
        setWaiting(false);
      });
  };

  useEffect(() => {
    if (user) {
      router.push("/home");
    }
  }, [user, router]);

  return (
    <div
      className={styles.backgroundImage}
      style={{ backgroundImage: `url('${tenant.loginBackgroundImage}')` }}
    >
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1 className={styles.title}>{tenant.loginTitle}</h1>
          {user === null && !waiting && <LoginButton onClick={signIn} />}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
