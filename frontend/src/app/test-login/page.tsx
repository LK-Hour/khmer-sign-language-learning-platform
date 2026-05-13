"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function TestLoginPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const tgContainerRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, data?: any) => {
    setLogs((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg} ${
        data ? JSON.stringify(data, null, 2) : ""
      }`,
    ]);
  };

  // 1. Google Auth Callback
  const handleGoogleSuccess = async (response: any) => {
    addLog("Google response received", response);
    try {
      const res = await fetch("http://localhost:8000/api/auth/login/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: response.credential }),
      });
      const data = await res.json();
      addLog("Backend Google verification", data);
    } catch (e: any) {
      addLog("Google validation error", e.message);
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
            fetch("http://localhost:8000/api/auth/login/facebook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code: response.authResponse.accessToken }),
            })
              .then((r) => r.json())
              .then((data) => addLog("Backend Facebook verification:", data))
              .catch((e) => addLog("Facebook validation error:", e.message));
          } else {
            addLog("User cancelled Facebook login or did not fully authorize.");
          }
        },
        { scope: "public_profile,email" }
      );
    } else {
      addLog("Facebook SDK not loaded yet.");
    }
  };

  // 3. Telegram Auth Javascript Function
  useEffect(() => {
    // Setup global callback for Telegram widget
    (window as any).onTelegramAuth = async (data: any) => {
      addLog("Telegram callback received:", data);
      if (!data) return;

      try {
        const payload = data.id_token ? { code: data.id_token } : data;
        const res = await fetch("http://localhost:8000/api/auth/login/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const responseData = await res.json();
        addLog("Backend Telegram verification:", responseData);
      } catch (e: any) {
        addLog("Telegram API push error:", e.message);
      }
    };
  }, []);

  // Use a ref to inject the Telegram script so it renders the button exactly here
  const telegramWrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Only inject if not already injected (we expect the button to be there, so check for script)
    if (telegramWrapperRef.current && !telegramWrapperRef.current.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://oauth.telegram.org/js/telegram-login.js?3";
      script.async = true;
      script.setAttribute("data-client-id", "8975622098"); // Your bot client id
      script.setAttribute("data-onauth", "onTelegramAuth(data)");
      script.setAttribute("data-request-access", "write");
      telegramWrapperRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="p-8 font-sans max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-black">OAuth Real Credentials Test</h1>
      
      <p className="mb-6 text-gray-500">
        Make sure the FastAPI backend is running on http://localhost:8000 before clicking these buttons!
      </p>

      {/* Load Google SDK */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).google) {
            (window as any).google.accounts.id.initialize({
              client_id: "678656172154-0ptvidknubu87g62r3u2fnffo3c7msst.apps.googleusercontent.com",
              callback: handleGoogleSuccess,
            });
            (window as any).google.accounts.id.renderButton(
              document.getElementById("google-buttonDiv"),
              { theme: "outline", size: "large" }
            );
            addLog("Google SDK initialized.");
          }
        }}
      />

      {/* Load Facebook SDK */}
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          if ((window as any).FB) {
            (window as any).FB.init({
              appId: "1599530575505984",
              cookie: true,
              xfbml: true,
              version: "v18.0",
            });
            addLog("Facebook SDK initialized.");
          }
        }}
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

        {/* Telegram Test Button (Using official js injection) */}
        <div ref={telegramWrapperRef} className="h-[40px] flex items-center relative">
          <button className="tg-auth-button bg-[#54A9EB] text-white px-5 py-2 rounded font-semibold h-[40px] hover:bg-[#4593DB] transition-colors">
            Sign In with Telegram
          </button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2 text-black">Logs (Watch the magic happen):</h2>
        <div className="bg-slate-900 p-4 rounded min-h-[300px] overflow-auto whitespace-pre-wrap text-sm font-mono text-green-400">
          {logs.map((log, i) => (
            <div key={i} className="mb-2 pb-2 border-b border-slate-800">
              {log}
            </div>
          ))}
          {logs.length === 0 && <div className="text-slate-500">No logs yet. Try logging in above.</div>}
        </div>
      </div>
    </div>
  );
}
