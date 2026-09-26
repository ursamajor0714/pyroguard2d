// app/login/page.tsx
// 관제실 운영자 로그인. 성공하면 서버가 HttpOnly 세션 쿠키를 심고, 원래 가려던 화면으로 보낸다.
'use client';

import React, { useEffect, useState } from 'react';
import { ShieldIcon } from '../../components/common/Icons';
import { api, ApiError } from '../../lib/client/api';

/** ?next= 는 이 사이트 안의 경로만 받는다 (다른 사이트로 보내는 오픈 리다이렉트 방지) */
function nextPath(): string {
  const next = new URLSearchParams(window.location.search).get('next') || '/';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // 이미 로그인된 단말이면 곧장 관제 화면으로
  useEffect(() => {
    api<{ authenticated: boolean }>('/api/auth/session')
      .then((res) => { if (res.authenticated) window.location.replace(nextPath()); })
      .catch(() => { /* 확인 실패 시 로그인 화면에 그대로 둔다 */ });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/auth/login', { method: 'POST', json: { password } });
      window.location.href = nextPath();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : '서버와 통신에 실패했습니다.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#060913] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] glass-panel border border-slate-700/80 rounded-2xl p-6 bg-[#090e1a] flex flex-col gap-4 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <ShieldIcon size={28} />
          </div>
          <h1 className="text-lg font-extrabold text-white tracking-wider">PyroGuard 2D</h1>
          <p className="text-xs text-slate-400">관제실 운영자 로그인</p>
        </div>

        <label className="flex flex-col gap-1.5 text-xs text-slate-300 font-bold">
          운영자 비밀번호
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            className="px-3 py-2.5 rounded-lg bg-slate-900 border-2 border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-blue-500 disabled:opacity-50"
          />
        </label>

        {error && <p role="alert" className="text-red-400 text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={busy || !password}
          className="py-2.5 rounded-xl text-sm font-extrabold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 disabled:opacity-50 cursor-pointer transition"
        >
          {busy ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
