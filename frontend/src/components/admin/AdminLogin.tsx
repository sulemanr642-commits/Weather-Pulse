import React, { useState } from 'react';
import { ShieldCheck, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useAdminLogin } from '@hooks';
import type { LoginResponse } from '@types';

export interface AdminLoginProps {
  onSuccess: (authData: LoginResponse) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loginMutation = useAdminLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMsg('Username is required.');
      return;
    }
    if (!password) {
      setErrorMsg('Password is required.');
      return;
    }

    setErrorMsg(null);
    loginMutation.mutate(
      { username: username.trim(), password },
      {
        onSuccess: (data) => {
          setPassword('');
          onSuccess(data);
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.detail ||
            err.response?.data?.message ||
            'Invalid credentials. Please verify your administrative access.';
          setErrorMsg(msg);
        },
      }
    );
  };

  return (
    <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ textAlign: 'center', margin: '8px 0 16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(30, 58, 138, 0.45) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
          }}
        >
          <ShieldCheck size={26} color="#38bdf8" />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#fff' }}>
          Administrator Authentication
        </h3>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary, rgba(255, 255, 255, 0.7))' }}>
          Enter authorized credentials to manage meteorological tracking targets.
        </p>
      </div>

      {errorMsg && (
        <div
          role="alert"
          data-testid="admin-login-error"
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={15} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Username Field */}
      <div>
        <label
          htmlFor="admin-username"
          style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'rgba(255, 255, 255, 0.8)' }}
        >
          Username
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <User size={16} color="rgba(255, 255, 255, 0.45)" style={{ position: 'absolute', left: '12px' }} />
          <input
            id="admin-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="admin"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Password Field */}
      <div>
        <label
          htmlFor="admin-password"
          style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: 'rgba(255, 255, 255, 0.8)' }}
        >
          Password
        </label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Lock size={16} color="rgba(255, 255, 255, 0.45)" style={{ position: 'absolute', left: '12px' }} />
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.07)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loginMutation.isPending}
        style={{
          marginTop: '6px',
          padding: '11px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)',
          border: '1px solid rgba(56, 189, 248, 0.4)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '13px',
          cursor: loginMutation.isPending ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.35)',
        }}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Authenticating...</span>
          </>
        ) : (
          <span>Authenticate Operator</span>
        )}
      </button>
    </form>
  );
};

export default AdminLogin;
