"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { useTranslation } from "@/i18n/useTranslation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

type GoogleCredentialResponse = {
  credential: string;
};

type FacebookLoginResponse = {
  authResponse?: {
    accessToken: string;
  };
};

type GoogleAccountsApi = {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement | null,
        options: { theme: "outline" | "filled_blue" | "filled_black"; size: "large" | "medium" | "small" }
      ) => void;
    };
  };
};

type FacebookSdk = {
  init: (config: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: FacebookLoginResponse) => void,
    options: { scope: string }
  ) => void;
};

declare global {
  interface Window {
    google?: GoogleAccountsApi;
    FB?: FacebookSdk;
  }
}

function serializeLogData(data: unknown): string {
  if (data === undefined) return "";
  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function TestLoginPage() {
  const { locale } = useTranslation();
  const searchParams = useSearchParams();
  const telegramContainerRef = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<string[]>(() => {
    const initialLogs = [
      `Frontend origin: ${typeof window === "undefined" ? "loading" : window.location.origin}`,
      `Backend API: ${API_BASE_URL}`,
      `Current locale: ${locale}`,
    ];
    const error = searchParams.get("error");
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");
    const user = searchParams.get("user");

    if (error) {
      initialLogs.push(`Telegram auth error: ${decodeURIComponent(error)}`);
    } else if (token && provider === "telegram") {
      initialLogs.push(
        `Telegram authentication successful: ${serializeLogData({
          token: `${token.substring(0, 30)}...`,
          user,
        })}`
      );
    }

    return initialLogs.map((message) => `[initial] ${message}`);
  });
  const [googleReady, setGoogleReady] = useState(false);
  const [facebookReady, setFacebookReady] = useState(false);
  const [telegramReady, setTelegramReady] = useState(false);

  const frontendOrigin =
    typeof window === "undefined" ? "loading" : window.location.origin;

  const addLog = useCallback((message: string, data?: unknown) => {
    const serialized = serializeLogData(data);
    setLogs((previous) => [
      ...previous,
      `[${new Date().toLocaleTimeString()}] ${message}${serialized ? ` ${serialized}` : ""}`,
    ]);
  }, []);

  const handleGoogleSuccess = useCallback(
    async (response: GoogleCredentialResponse) => {
      addLog("Google response received", {
        credential: `${response.credential.substring(0, 30)}...`,
      });

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: response.credential }),
        });
        addLog("Backend Google verification", await res.json());
      } catch (error) {
        addLog("Google validation error", getErrorMessage(error));
      }
    },
    [addLog]
  );

  const handleFacebookLogin = useCallback(() => {
    addLog("Initiating Facebook Login");

    if (!window.FB) {
      addLog("Facebook SDK is not loaded yet");
      return;
    }

    window.FB.login(
      (response) => {
        addLog("Facebook login response", response);

        if (!response.authResponse) {
          addLog("User cancelled Facebook login or did not fully authorize");
          return;
        }

        fetch(`${API_BASE_URL}/api/auth/login/facebook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: response.authResponse.accessToken }),
        })
          .then((res) => res.json())
          .then((data: unknown) => addLog("Backend Facebook verification", data))
          .catch((error: unknown) =>
            addLog("Facebook validation error", getErrorMessage(error))
          );
      },
      { scope: "public_profile,email" }
    );
  }, [addLog]);

  useEffect(() => {
    const container = telegramContainerRef.current;
    if (!container || container.querySelector("script")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", "KSL_Login_Bot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-auth-url", `${API_BASE_URL}/api/auth/login/telegram`);
    script.setAttribute("data-request-access", "write");
    script.onload = () => {
      setTelegramReady(true);
      addLog("Telegram widget loaded");
    };
    script.onerror = () => addLog("Telegram widget failed to load");
    container.appendChild(script);

    return () => {
      script.remove();
    };
  }, [addLog]);

  const statusRows = useMemo(
    () => [
      ["Google SDK", googleReady ? "ready" : "not ready"],
      ["Facebook SDK", facebookReady ? "ready" : "not ready"],
      ["Telegram widget", telegramReady ? "ready" : "not ready"],
    ],
    [facebookReady, googleReady, telegramReady]
  );

  return (
    <div className="mx-auto max-w-5xl p-8 font-sans">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-black">OAuth Diagnostics</h1>
          <p className="mt-2 text-gray-600">
            Validate provider handshakes against the local backend.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <LocaleSwitcher />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Current location</strong>
          <code className="ml-2 rounded bg-blue-100 px-2 py-1">
            /{locale}/test-login
          </code>
        </p>
        <p className="mt-2 text-sm text-blue-800">
          <strong>Language</strong>
          <span className="ml-2">{locale === "kh" ? "Khmer" : "English"}</span>
        </p>
      </div>

      <p className="mb-2 text-gray-500">Frontend origin: {frontendOrigin}</p>
      <p className="mb-6 text-gray-500">Backend API: {API_BASE_URL}</p>

      <div className="mb-6 grid gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 sm:grid-cols-3">
        {statusRows.map(([label, value]) => (
          <div key={label}>
            {label}: {value}
          </div>
        ))}
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (!window.google) return;

            window.google.accounts.id.initialize({
              client_id:
                "678656172154-0ptvidknubu87g62r3u2fnffo3c7msst.apps.googleusercontent.com",
              callback: handleGoogleSuccess,
            });
            window.google.accounts.id.renderButton(
              document.getElementById("google-buttonDiv"),
              { theme: "outline", size: "large" }
            );
            setGoogleReady(true);
            addLog("Google SDK initialized");
          } catch (error) {
            addLog("Google SDK initialization failed", getErrorMessage(error));
          }
        }}
        onError={() => addLog("Google SDK failed to load")}
      />

      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (!window.FB) return;

            window.FB.init({
              appId: "1599530575505984",
              cookie: true,
              xfbml: true,
              version: "v18.0",
            });
            setFacebookReady(true);
            addLog("Facebook SDK initialized");
          } catch (error) {
            addLog("Facebook SDK initialization failed", getErrorMessage(error));
          }
        }}
        onError={() => addLog("Facebook SDK failed to load")}
      />

      <div className="mb-8 flex flex-wrap items-center gap-6 rounded-lg border border-gray-200 bg-gray-50 p-6">
        <div id="google-buttonDiv" className="h-[40px]" />
        <button
          onClick={handleFacebookLogin}
          className="h-[40px] rounded bg-[#1877F2] px-5 py-2 font-semibold text-white transition-colors hover:bg-[#166FE5]"
        >
          Login with Facebook
        </button>
        <div ref={telegramContainerRef} className="flex h-[40px] items-center" />
      </div>

      <div className="mt-8">
        <h2 className="mb-2 text-xl font-bold text-black">Logs</h2>
        <div className="min-h-[300px] overflow-auto whitespace-pre-wrap rounded bg-slate-900 p-4 font-mono text-sm text-green-400">
          {logs.map((log, index) => (
            <div key={`${log}-${index}`} className="mb-2 border-b border-slate-800 pb-2">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
