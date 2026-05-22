"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function TestLoginPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [googleReady, setGoogleReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);
  const [telegramReady, setTelegramReady] = useState(false);
  const [frontendOrigin, setFrontendOrigin] = useState("loading...");
  const telegramContainerRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const addLog = (msg: string, data?: any) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg} ${
        data ? JSON.stringify(data, null, 2) : ""
      }`,
    ]);
  };

  // Check for Telegram redirect params from server-side auth
  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
    const user = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      addLog("❌ Telegram auth error:", decodeURIComponent(error));
    } else if (token && provider === "telegram") {
      addLog("✅ Telegram authentication successful!", {
        token: token.substring(0, 30) + "...",
        user: user,
      });
    }
  }, [searchParams]);

  // 1. Google Auth Callback
  const handleGoogleSuccess = async (response: any) => {
    addLog("Google response received", response);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: response.credential }),
      });
      const data = await res.json();
      addLog("✅ Backend Google verification", data);
    } catch (e: any) {
      addLog("❌ Google validation error", e.message);
    }
  };

  // 2. Facebook Auth Callback
  const handleFacebookLogin = () => {
    addLog("Initiating Facebook Login...");
    if (typeof window !== "undefined" && (window as any).FB) {
      (window as any).FB.login(
        (response: any) => {
          addLog("Facebook login response:", response);
          if (response.authResponse) {
            fetch(`${API_BASE_URL}/api/auth/login/facebook`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: response.authResponse.accessToken }),
            })
              .then((r) => r.json())
              .then((data) => addLog("✅ Backend Facebook verification:", data))
              .catch((e) => addLog("❌ Facebook validation error:", e.message));
          } else {
            addLog("User cancelled Facebook login or did not fully authorize.");
          }
        },
        { scope: "public_profile,email" }
      );
    } else {
      addLog("❌ Facebook SDK not loaded yet.");
    }
  };

  useEffect(() => {
    setFrontendOrigin(window.location.origin);
    addLog("Frontend origin:", window.location.origin);
    addLog("Backend API:", API_BASE_URL);
    addLog("Telegram widget using data-auth-url server-side flow");
  }, []);

  // Inject Telegram Widget Script Dynamically
  useEffect(() => {
    if (telegramContainerRef.current && !telegramContainerRef.current.querySelector('script')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://telegram.org/js/telegram-widget.js?22";
      script.setAttribute("data-telegram-login", "KSL_Login_Bot");
      script.setAttribute("data-size", "large");
      script.setAttribute("data-auth-url", `${API_BASE_URL}/api/auth/login/telegram`);
      script.setAttribute("data-request-access", "write");
      script.onload = () => {
        setTelegramReady(true);
        addLog("✅ Telegram widget loaded");
      };
      script.onerror = () => addLog("❌ Telegram widget failed to load");
      telegramContainerRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="p-8 font-sans max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-black">
        OAuth Real Credentials Test (Server-side Telegram)
      </h1>

      <p className="mb-6 text-gray-500">Frontend origin: {frontendOrigin}</p>
      <p className="mb-6 text-gray-500">Backend API: {API_BASE_URL}</p>

      <div className="mb-6 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-3">
        <div>Google SDK: {googleReady ? "✅ ready" : "⏳ not ready"}</div>
        <div>Facebook SDK: {facebookReady ? "✅ ready" : "⏳ not ready"}</div>
        <div>Telegram widget: {telegramReady ? "✅ ready" : "⏳ not ready"}</div>
      </div>

      {/* Load Google SDK */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if ((window as any).google) {
              (window as any).google.accounts.id.initialize({
                client_id: "678656172154-0ptvidknubu87g62r3u2fnffo3c7msst.apps.googleusercontent.com",
                callback: handleGoogleSuccess,
              });
              (window as any).google.accounts.id.renderButton(
                document.getElementById("google-buttonDiv"),
                { theme: "outline", size: "large" }
              );
              setGoogleReady(true);
              addLog("✅ Google SDK initialized");
            }
          } catch (error: any) {
            addLog("❌ Google SDK initialization failed:", error?.message ?? error);
          }
        }}
        onError={() => addLog("❌ Google SDK failed to load")}
      />

      {/* Load Facebook SDK */}
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if ((window as any).FB) {
              (window as any).FB.init({
                appId: "1599530575505984",
                cookie: true,
                xfbml: true,
                version: "v18.0",
              });
              setFacebookReady(true);
              addLog("✅ Facebook SDK initialized");
            }
          } catch (error: any) {
            addLog("❌ Facebook SDK initialization failed:", error?.message ?? error);
          }
        }}
        onError={() => addLog("❌ Facebook SDK failed to load")}
      />

      <div className="flex flex-wrap gap-6 mb-8 items-center bg-gray-50 p-6 rounded-lg border border-gray-200">
        {/* Google Test Button Container */}
        <div>
          <div id="google-buttonDiv" className="h-[40px]"></div>
        </div>

        {/* Facebook Test Button */}
        <div>
          <button
            onClick={handleFacebookLogin}
            className="bg-[#1877F2] text-white px-5 py-2 rounded font-semibold h-[40px] hover:bg-[#166FE5] transition-colors"
          >
            Login with Facebook
          </button>
        </div>

        {/* Telegram Server-side Auth Widget - Container for dynamic injection */}
        <div ref={telegramContainerRef} className="h-[40px] flex items-center"></div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2 text-black">
          Logs (Watch the magic happen):
        </h2>
        <div className="bg-slate-900 p-4 rounded min-h-[300px] overflow-auto whitespace-pre-wrap text-sm font-mono text-green-400">
          {logs.map((log, i) => (
            <div key={i} className="mb-2 pb-2 border-b border-slate-800">
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-500">
              No logs yet. Try logging in above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
