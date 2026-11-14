import { useEffect, useState, type ReactNode } from 'react';
import { IconClock, IconDeck, IconPlus, IconUser } from './components/icons';
import { Sheet } from './components/ui';
import { api } from './lib/api';
import type { User } from './lib/types';
import { ContestDetail } from './pages/ContestDetail';
import { Contests } from './pages/Contests';
import { Discover } from './pages/Discover';
import { Landing } from './pages/Landing';
import { LegalPage } from './pages/Legal';
import { Login } from './pages/Login';
import { Me } from './pages/Me';
import { NewContest } from './pages/NewContest';
import { NewSwag } from './pages/NewSwag';
import { SwagDetail } from './pages/SwagDetail';
import { go, useRoute } from './router';
import { StoreProvider, useStore } from './store';

export default function App() {
  const [legal] = useRoute();
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const load = () => void api.getUser().then(setUser).catch(() => setUser(null));
    load();
    return api.onAuthChange(load);
  }, []);

  if (legal === 'privacidad' || legal === 'terminos') return <LegalPage kind={legal} />;
  if (user === undefined) return <div className="spin" role="status" aria-label="Cargando" />;
  // Sin sesión: la landing es la portada; #/entrar y #/crear abren el formulario (y cualquier enlace directo también).
  if (!user) return legal === 'descubrir' || legal === 'inicio' ? <Landing /> : <Login />;
  return (
    <StoreProvider user={user}>
      <Shell />
    </StoreProvider>
  );
}

function Shell() {
  const [head, arg] = useRoute();
  const { toastMsg } = useStore();
  const [adding, setAdding] = useState(false);

  const active = ['concursos', 'concurso', 'nuevo-concurso'].includes(head) ? 'concursos' : head === 'yo' ? 'yo' : 'descubrir';
  let page: ReactNode;
  switch (head) {
    case 'swag': page = <SwagDetail id={arg} />; break;
    case 'nuevo': page = <NewSwag />; break;
    case 'concursos': page = <Contests />; break;
    case 'concurso': page = <ContestDetail id={arg} />; break;
    case 'nuevo-concurso': page = <NewContest />; break;
    case 'yo': page = <Me />; break;
    default: page = <Discover />;
  }
  const wide = head === 'yo' || (!head || head === 'descubrir');

  return (
    <div className="app">
      <header className="topbar">
        <a className="wordmark" href="#/descubrir"><i />SWAG<span>/</span>HUNTERS</a>
      </header>

      {/* Fuera del encabezado: su backdrop-filter rompería el position: fixed de la barra. */}
      <nav className="tabbar" aria-label="Principal">
        <a className="tab" href="#/descubrir" aria-current={active === 'descubrir' ? 'page' : undefined}><IconDeck /><span>Descubrir</span></a>
        <a className="tab" href="#/concursos" aria-current={active === 'concursos' ? 'page' : undefined}><IconClock /><span>Concursos</span></a>
        <button className="tab plus" onClick={() => setAdding(true)} aria-label="Subir"><span className="disc"><IconPlus style={{ width: 22, height: 22 }} /><span className="plus-text">Subir</span></span></button>
        <a className="tab" href="#/yo" aria-current={active === 'yo' ? 'page' : undefined}><IconUser /><span>Yo</span></a>
      </nav>

      <main key={head} className={`page ${wide ? 'wide' : ''}`}>{page}</main>

      {adding && (
        <Sheet title="¿Qué quieres subir?" onClose={() => setAdding(false)}>
          <button className="btn primary block" onClick={() => { setAdding(false); go('nuevo'); }}>Un swag que encontré</button>
          <button className="btn block" onClick={() => { setAdding(false); go('nuevo-concurso'); }}>Un concurso con hora</button>
        </Sheet>
      )}
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  );
}
