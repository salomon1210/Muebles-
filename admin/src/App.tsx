import { useEffect, useState } from 'preact/hooks';
import type { Session } from '@supabase/supabase-js';
import { supabase, configurado } from './lib/supabase';
import { Login } from './components/Login';
import { ProductForm } from './components/ProductForm';
import { ProductList } from './components/ProductList';
import { ProjectSum } from './components/ProjectSum';

type Tab = 'cargar' | 'productos' | 'proyecto';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);
  const [tab, setTab] = useState<Tab>('productos');
  // código a editar (cuando se hace click en un producto de la lista)
  const [editar, setEditar] = useState<string | null>(null);

  useEffect(() => {
    if (!configurado) {
      setCargando(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!configurado) {
    return (
      <div class="login card">
        <h1>Falta configurar Supabase</h1>
        <p class="muted">
          Copiá <code>.env.example</code> a <code>.env</code> y completá{' '}
          <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. Ver{' '}
          <code>supabase/README.md</code>.
        </p>
      </div>
    );
  }

  if (cargando) return <div class="wrap" style="padding:40px">Cargando…</div>;
  if (!session) return <Login />;

  function abrirEdicion(codigo: string) {
    setEditar(codigo);
    setTab('cargar');
  }
  function nuevoProducto() {
    setEditar(null);
    setTab('cargar');
  }

  return (
    <div>
      <header class="topbar">
        <span class="brand">Milano Home <b>·</b> Panel</span>
        <nav class="tabs">
          <button class={`tab ${tab === 'productos' ? 'active' : ''}`} onClick={() => setTab('productos')}>
            Productos
          </button>
          <button class={`tab ${tab === 'cargar' ? 'active' : ''}`} onClick={nuevoProducto}>
            + Cargar
          </button>
          <button class={`tab ${tab === 'proyecto' ? 'active' : ''}`} onClick={() => setTab('proyecto')}>
            Sumar proyecto
          </button>
          <button class="tab" onClick={() => supabase.auth.signOut()}>Salir</button>
        </nav>
      </header>

      <main class="wrap" style="padding-bottom:60px">
        {tab === 'cargar' && (
          <ProductForm
            key={editar ?? 'nuevo'}
            codigoEditar={editar}
            onGuardado={() => setTab('productos')}
          />
        )}
        {tab === 'productos' && <ProductList onEditar={abrirEdicion} onNuevo={nuevoProducto} />}
        {tab === 'proyecto' && <ProjectSum />}
      </main>
    </div>
  );
}
