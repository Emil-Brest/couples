"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import Link from "next/link";

type Props = {
  user: { name: string; email: string };
  partner: { id: string; name: string } | null;
  inviteUrl: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return { dark, toggle };
}

export default function ProfileClient({ user, partner, inviteUrl }: Props) {
  const router = useRouter();
  const { dark, toggle } = useTheme();
  const [copied, setCopied] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleCopy() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await signOut();
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Perfil</h1>
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full flex items-center justify-center text-lg
            bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Cambiar tema"
        >
          {dark ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6">
        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-black dark:bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-white dark:text-black">
              {initials(user.name)}
            </span>
          </div>
          <div>
            <p className="font-semibold text-base">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Pareja */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-1">
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Pareja
          </p>
          {partner ? (
            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold">
                {initials(partner.name)}
              </div>
              <p className="font-medium text-sm">{partner.name}</p>
              <span className="ml-auto text-green-500 text-xs font-medium">Conectados 💚</span>
            </div>
          ) : (
            <div className="pt-1 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Todavía no se unió nadie.
              </p>
              {inviteUrl && (
                <button
                  onClick={handleCopy}
                  className="w-full text-left text-xs text-gray-400 dark:text-gray-500
                    border border-dashed border-gray-200 dark:border-gray-700
                    rounded-xl px-3 py-2 hover:border-gray-400 transition-colors"
                >
                  <span className="block truncate">{inviteUrl}</span>
                  <span className="block mt-1 font-medium text-black dark:text-white">
                    {copied ? "✓ Copiado" : "Tocar para copiar el link"}
                  </span>
                </button>
              )}
              {!inviteUrl && (
                <Link
                  href="/invite"
                  className="text-sm underline text-gray-600 dark:text-gray-400"
                >
                  Crear espacio compartido
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="border border-gray-100 dark:border-gray-800 rounded-2xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {inviteUrl && partner && (
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm
                hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
            >
              <span>Compartir link de invitación</span>
              <span className="text-gray-400 text-xs">{copied ? "✓ Copiado" : "🔗"}</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-between px-4 py-3.5 text-sm
              text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 text-left"
          >
            <span>{loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
