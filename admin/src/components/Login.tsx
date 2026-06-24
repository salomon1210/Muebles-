import { useState } from 'preact/hooks';
import { supabase } from '../lib/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e: Event) {
    e.preventDefault();
    setErr('');
    setCargando(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setCargando(false);
    if (error) setErr('Email o contraseña incorrectos.');
  }

  return (
    <div class="login">
      <div class="card">
        <h1 style="margin-top:0">Milano Home</h1>
        <p class="muted">Panel interno. Ingresá con tu usuario.</p>
        <form onSubmit={entrar}>
          <label>
            <span>Email</span>
            <input type="email" value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} required />
          </label>
          <label>
            <span>Contraseña</span>
            <input type="password" value={pass} onInput={(e) => setPass((e.target as HTMLInputElement).value)} required />
          </label>
          {err && <div class="msg err">{err}</div>}
          <button class="btn" style="width:100%" disabled={cargando}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
