import React, { useState } from 'react';
import { PlayerSettings, DriveAccount, ThemePreset } from '../../types';
import { GoogleDriveService } from '../../services/googleDriveService';
import { THEMES } from '../../utils/theme';
import {
  Settings,
  X,
  Key,
  Users,
  Check,
  Plus,
  Trash2,
  Sparkles,
  HelpCircle,
  Copy,
  Globe,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlayerSettings;
  onUpdateSettings: (settings: Partial<PlayerSettings>) => void;
  accounts: DriveAccount[];
  activeAccountId: string | null;
  onAccountsChange: () => void;
  onOpenReadme: () => void;
  accentColor?: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  accounts,
  activeAccountId,
  onAccountsChange,
  onOpenReadme,
  accentColor = '#ff6b00',
}) => {
  const [clientIdInput, setClientIdInput] = useState(
    settings.googleClientId || GoogleDriveService.getSavedClientId() || ''
  );
  const [directTokenInput, setDirectTokenInput] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [activeAuthTab, setActiveAuthTab] = useState<'oauth' | 'token'>('oauth');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  if (!isOpen) return null;

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  const handleSaveClientId = () => {
    GoogleDriveService.setSavedClientId(clientIdInput);
    onUpdateSettings({ googleClientId: clientIdInput.trim() });
    setSaveSuccess(true);
    setSignInError(null);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleClearClientId = () => {
    localStorage.removeItem('vlx_google_client_id');
    setClientIdInput('');
    onUpdateSettings({ googleClientId: '' });
    setSignInError(null);
  };

  const handleAddAccount = async () => {
    const idToUse = clientIdInput.trim() || settings.googleClientId;
    if (!idToUse) {
      setSignInError('Please enter a Google Cloud OAuth Client ID, or use the 30-Second Token method below.');
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);

    try {
      await GoogleDriveService.addGoogleAccount(idToUse);
      onAccountsChange();
    } catch (err: any) {
      console.warn('Google sign-in notice:', err?.message || err);
      const msg = err?.message || String(err);
      if (msg.includes('invalid_client') || msg.includes('not found') || msg.includes('401')) {
        setSignInError(
          'Error 401: invalid_client — Google could not find this OAuth Client ID. See the fix below.'
        );
        setShowTroubleshooting(true);
      } else {
        setSignInError(msg || 'Sign-in canceled or interrupted.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAddDirectToken = async () => {
    if (!directTokenInput.trim()) {
      setSignInError('Please paste a valid Google OAuth Access Token.');
      return;
    }

    setIsSigningIn(true);
    setSignInError(null);

    try {
      await GoogleDriveService.addAccountWithAccessToken(directTokenInput.trim());
      setDirectTokenInput('');
      onAccountsChange();
      setSignInError(null);
    } catch (err: any) {
      console.warn('Direct token auth notice:', err?.message || err);
      setSignInError('Invalid or expired token. Please generate a fresh token from OAuth Playground.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRemoveAccount = (id: string) => {
    GoogleDriveService.removeAccount(id);
    onAccountsChange();
  };

  const handleSwitchAccount = (id: string) => {
    GoogleDriveService.setActiveAccountId(id);
    onAccountsChange();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-6 text-white shadow-2xl border border-white/10 relative max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">VLX Studio Settings</h2>
              <p className="text-xs text-neutral-400">Google Drive Authentication & Player Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="my-4 overflow-y-auto pr-2 space-y-5 flex-1 text-xs">
          {/* Connection Method Tabs */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" /> Connect Google Drive
              </span>
              <button
                onClick={onOpenReadme}
                className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Full Setup Guide
              </button>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveAuthTab('oauth')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeAuthTab === 'oauth'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
                style={{ backgroundColor: activeAuthTab === 'oauth' ? accentColor : undefined }}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google Cloud Client ID</span>
              </button>
              <button
                onClick={() => setActiveAuthTab('token')}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                  activeAuthTab === 'token'
                    ? 'bg-amber-500 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
                style={{ backgroundColor: activeAuthTab === 'token' ? accentColor : undefined }}
              >
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>Instant Token (30 Seconds)</span>
              </button>
            </div>

            {/* TAB 1: OAuth Client ID */}
            {activeAuthTab === 'oauth' && (
              <div className="space-y-3 pt-1">
                {/* Authorized Origin Copy */}
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 truncate text-neutral-300">
                    <span className="text-neutral-400 font-semibold">Authorized Origin:</span>
                    <span className="font-mono text-amber-300 truncate">{currentOrigin}</span>
                  </div>
                  <button
                    onClick={handleCopyOrigin}
                    className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white shrink-0 ml-2 transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedOrigin ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOrigin ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    placeholder="Enter your Google OAuth Client ID (.apps.googleusercontent.com)"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSaveClientId}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition hover:scale-[1.02] flex items-center gap-1 shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {saveSuccess ? <Check className="w-4 h-4 text-white" /> : 'Save'}
                  </button>
                  {clientIdInput && (
                    <button
                      onClick={handleClearClientId}
                      className="px-2.5 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/10 transition"
                      title="Clear Client ID"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleAddAccount}
                    disabled={isSigningIn}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition hover:scale-[1.01] disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentColor }}
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>{isSigningIn ? 'Signing in with Google...' : 'Sign in with Google Account'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Direct Access Token (Instant 30s OAuth Playground Bypass) */}
            {activeAuthTab === 'token' && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-neutral-300 space-y-1.5">
                  <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" /> Instant Connection via Google OAuth Playground
                  </div>
                  <p>
                    Connect your personal Google Drive in 30 seconds without configuring Google Cloud Console:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[10px] pl-1">
                    <li>
                      Open{' '}
                      <a
                        href="https://developers.google.com/oauthplayground"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline font-semibold inline-flex items-center gap-0.5"
                      >
                        Google OAuth 2.0 Playground <ExternalLink className="w-3 h-3 inline" />
                      </a>
                    </li>
                    <li>
                      On the left under <strong>Step 1</strong>, scroll to <strong>Drive API v3</strong> and check{' '}
                      <code>https://www.googleapis.com/auth/drive.readonly</code>.
                    </li>
                    <li>
                      Click <strong>Authorize APIs</strong> and select your Google account.
                    </li>
                    <li>
                      Under <strong>Step 2</strong>, click <strong>Exchange authorization code for tokens</strong>.
                    </li>
                    <li>Copy the <strong>Access token</strong> (starts with <code>ya29.a0...</code>) and paste below.</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={directTokenInput}
                    onChange={(e) => setDirectTokenInput(e.target.value)}
                    placeholder="Paste Google Access Token (ya29.a0AfH6SM...)"
                    className="flex-1 px-3 py-2 bg-neutral-900 border border-white/15 rounded-xl text-white font-mono text-[11px] focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleAddDirectToken}
                    disabled={isSigningIn || !directTokenInput.trim()}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white transition hover:scale-[1.02] disabled:opacity-50 shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {isSigningIn ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              </div>
            )}

            {/* Error Notification & Detailed Fix Guide */}
            {signInError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-neutral-200 text-[11px] space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2 text-red-300 font-semibold">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{signInError}</span>
                </div>

                <div className="pt-2 border-t border-white/10 space-y-2">
                  <p className="font-bold text-amber-300">
                    Why does "The OAuth client was not found (Error 401: invalid_client)" happen?
                  </p>
                  <p className="text-neutral-300 leading-relaxed text-[11px]">
                    Google throws this when the requested Client ID does not exist in Google's cloud database, or hasn't finished replicating globally across Google's auth servers.
                  </p>
                  
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1.5">
                    <p className="font-semibold text-white">How to fix it properly:</p>
                    <p className="text-neutral-300">
                      <strong>Option 1 (Fastest — 30 seconds):</strong> Click the <strong>Instant Token</strong> tab above, get a token from Google OAuth Playground, and paste it. No setup required!
                    </p>
                    <p className="text-neutral-300">
                      <strong>Option 2:</strong> Create your own Web Client ID in{' '}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline font-semibold inline-flex items-center gap-0.5"
                      >
                        Google Cloud Console <ExternalLink className="w-3 h-3 inline" />
                      </a>:
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-0.5 text-neutral-400 text-[10px]">
                      <li>Application type: <strong>Web application</strong></li>
                      <li>
                        Authorized JavaScript origin: <code>{currentOrigin}</code>
                      </li>
                      <li>In OAuth consent screen, add your email under <strong>Test users</strong>.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Connected Accounts List */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" /> Connected Accounts ({accounts.length})
            </span>

            {accounts.length === 0 ? (
              <div className="py-4 text-center text-neutral-400">
                <p>No Google accounts connected yet.</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Use either the Client ID or Instant Token tab above to link your drive.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((acc) => {
                  const isActive = activeAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition ${
                        isActive
                          ? 'bg-amber-500/15 border-amber-500/40'
                          : 'bg-white/5 hover:bg-white/10 border-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {acc.avatarUrl ? (
                          <img src={acc.avatarUrl} alt={acc.name} className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center font-bold">
                            {acc.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <h4 className="font-semibold text-white truncate">{acc.name}</h4>
                          <span className="text-[10px] text-neutral-400 truncate block">{acc.email}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                            Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSwitchAccount(acc.id)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[11px] text-neutral-200"
                          >
                            Switch
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveAccount(acc.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-red-400"
                          title="Remove account"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Themes & Display */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-3">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Color Accent Themes
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(THEMES) as ThemePreset[]).map((themeKey) => {
                const t = THEMES[themeKey];
                const isSelected = settings.theme === themeKey;
                return (
                  <button
                    key={themeKey}
                    onClick={() => onUpdateSettings({ theme: themeKey })}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition text-left ${
                      isSelected
                        ? 'bg-white/15 border-white/40 shadow-md font-bold'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 font-medium'
                    }`}
                  >
                    <div
                      className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: t.primary }}
                    />
                    <span className="truncate text-xs">{t.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
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
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
};
