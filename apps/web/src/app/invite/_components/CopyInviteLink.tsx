"use client";

import { useState } from "react";

export default function CopyInviteLink({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 border rounded-md px-3 py-2 text-sm text-gray-700 break-all text-left">
        {inviteUrl}
      </div>
      <button
        onClick={handleCopy}
        className="w-full bg-black text-white rounded-md py-2 text-sm font-medium"
      >
        {copied ? "¡Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
