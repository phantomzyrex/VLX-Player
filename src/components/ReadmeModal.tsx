import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink, Copy, Check, ShieldCheck, Key, Globe } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  accentColor = '#ff6b00',
}) => {
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  if (!isOpen) return null;

  const copyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Google OAuth Setup Guide</h2>
              <p className="text-xs text-neutral-400">Step-by-step instructions for Google Drive API access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Guide */}
        <div className="my-4 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed flex-1">
          {/* Origin quick copy banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Authorized JavaScript Origin URL
              </span>
              <button
                onClick={copyOrigin}
                className="text-[11px] px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 transition"
              >
                {copiedOrigin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedOrigin ? 'Copied!' : 'Copy Origin'}</span>
              </button>
            </div>
            <code className="text-[11px] font-mono text-neutral-200 block break-all mt-1 bg-black/40 p-2 rounded-lg">
              {currentOrigin}
            </code>
          </div>

          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <h4 className="font-bold text-sm text-white mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">1</span>
              Create Google Cloud Project & Enable Drive API
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] pl-1">
              <li>Open the <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline inline-flex items-center gap-0.5">Google Cloud Console <ExternalLink className="w-3 h-3 inline" /></a>.</li>
              <li>Create a new project or select an existing one.</li>
              <li>Go to <strong>APIs & Services &gt; Library</strong>.</li>
              <li>Search for <strong>Google Drive API</strong> and click <strong>Enable</strong>.</li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <h4 className="font-bold text-sm text-white mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">2</span>
              Configure OAuth Consent Screen
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] pl-1">
              <li>In the Cloud Console, navigate to <strong>APIs & Services &gt; OAuth consent screen</strong>.</li>
              <li>Select <strong>External</strong> user type and click Create.</li>
              <li>Enter App Name (e.g. <code>VLX Player</code>) and your support email.</li>
              <li>Under Scopes, add <code>.../auth/drive.readonly</code> and userinfo scopes.</li>
              <li>Add your personal Google account as a <strong>Test User</strong> while in testing mode.</li>
            </ol>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <h4 className="font-bold text-sm text-white mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">3</span>
              Generate OAuth 2.0 Web Client ID
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] pl-1">
              <li>Go to <strong>APIs & Services &gt; Credentials</strong> and click <strong>+ Create Credentials &gt; OAuth client ID</strong>.</li>
              <li>Select <strong>Web application</strong> as Application type.</li>
              <li>Under <strong>Authorized JavaScript origins</strong>, click Add URI and paste the Origin URL from above: <br/><code className="text-amber-300 font-mono text-[10px] break-all">{currentOrigin}</code></li>
              <li>Click <strong>Create</strong> and copy your new Client ID.</li>
            </ol>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <h4 className="font-bold text-sm text-white mb-1.5 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[11px]">4</span>
              Paste in VLX Settings & Connect
            </h4>
            <p className="text-neutral-300 text-[11px]">
              Open <strong>Settings</strong> in VLX Player (gear icon top right), paste the Client ID in the input box, click <strong>Save</strong>, and click <strong>Add Account</strong> to authenticate seamlessly!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{
              backgroundColor: accentColor,
              boxShadow: `0 0 16px ${accentColor}66`,
            }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
