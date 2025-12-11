// src/auth/GoogleLoginButton.js
import React, { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const GOOGLE_CLIENT_ID =
  "408601067528-37bv9u9223pje698vpmueabg2q9o84a0.apps.googleusercontent.com";

function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (resp) => {
        if (resp.credential) {
          loginWithGoogle(resp.credential).catch(() => {
            // error handled already
          });
        }
      },
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-login-btn"),
      {
        theme: "filled_blue",
        size: "large",
        width: "100%",
        shape: "pill",
      }
    );
  }, [loginWithGoogle]);

  return <div id="google-login-btn" style={{ marginTop: 10, width: "100%" }} />;
}

export default GoogleLoginButton;
