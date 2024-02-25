import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/auth";
import { login, logout } from "@/libs/auth";
import LoginButton from "@/components/LoginButton";

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
    <div>
      <div style={{ display: "flex", height: "100vh" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "2em" }}>HAL-SHARE</div>
          {user === null && !waiting && <LoginButton onClick={signIn} />}
        </div>
        <div
          style={{
            flex: 2,
            backgroundImage: "url('login-image.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            margin: "7px",
          }}
        ></div>
      </div>
    </div>
  );
};

export default LoginPage;
