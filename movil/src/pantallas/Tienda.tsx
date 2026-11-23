import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import * as db from '../db';
import { aviso } from '../estado';
import * as nube from '../nube';
import { C, confirmar, e, Fila, Mini, Nota, Opciones, Tarjeta, Titulo } from '../ui';

type Paquete = { id: number; tipo: 'voz' | 'perfil'; nombre: string; descripcion: string; descargas: number; autor: string };
type Respuesta = { paquetes: Paquete[]; totales: { tipo: string; total: number }[] };
type VozPublica = { nombre: string; rate: number; pitch: number; guion: string[] };
type Descarga =
  | { tipo: 'voz'; nombre: string; contenido: VozPublica }
  | { tipo: 'perfil'; nombre: string; contenido: { nombre: string; etiqueta: string; voz: VozPublica } };

async function descargar(id: number) {
  const d = await nube.api<Descarga>(`/marketplace/${id}/descargar`, { metodo: 'POST' });
  const voz = d.tipo === 'voz' ? { ...d.contenido, nombre: d.nombre } : d.contenido.voz;
  const perfil = d.tipo === 'voz' ? { nombre: d.nombre, etiqueta: 'Móvil' } : d.contenido;
  const idVoz = db.ejecutar('INSERT INTO voces (nombre, rate, pitch, guion) VALUES (?, ?, ?, ?)',
    [voz.nombre, voz.rate, voz.pitch, JSON.stringify(voz.guion)]);
  db.ejecutar('INSERT INTO perfiles (nombre, etiqueta, voz_id) VALUES (?, ?, ?)', [perfil.nombre, perfil.etiqueta, idVoz]);
  aviso('Guardado en Perfiles. Ya funciona sin internet.');
}

export function Tienda() {
  const [tipo, setTipo] = useState('');
  const [q, setQ] = useState('');
  const [r, setR] = useState<Respuesta | null>(null);
  const [error, setError] = useState('');
  const turno = useRef(0);

  async function buscar() {
    const mio = ++turno.current;
    try {
      const nuevo = await nube.api<Respuesta>(`/marketplace?tipo=${tipo}&q=${encodeURIComponent(q.trim())}`);
      if (mio === turno.current) { setR(nuevo); setError(''); }
    } catch (x) {
      if (mio === turno.current) setError((x as Error).message);
    }
  }
  useEffect(() => {
    const espera = setTimeout(buscar, 250);
    return () => { clearTimeout(espera); turno.current++; };
  }, [tipo, q]);

  const total = (t: string) => r?.totales.find((x) => x.tipo === t)?.total ?? 0;
  return (
    <>
      <Titulo t="Tienda" sub="Perfiles y voces de la comunidad." />
      <TextInput style={[e.campo, { backgroundColor: C.panel }]} placeholder="Buscar paquetes" placeholderTextColor={C.suave}
        accessibilityLabel="Buscar paquetes" maxLength={60} value={q} onChangeText={setQ} returnKeyType="search" />
      <Opciones opciones={[['', 'Todo'], ['voz', 'Voces'], ['perfil', 'Perfiles']]} valor={tipo} fn={setTipo} />
      {error !== '' ? <Tarjeta><Nota>{error}</Nota><Mini t="Reintentar" fn={buscar} /></Tarjeta>
        : !r ? <Nota>Cargando…</Nota> : (
          <>
            <Nota>{total('voz')} voces y {total('perfil')} perfiles publicados</Nota>
            {r.paquetes.length === 0 ? <Nota>No hay paquetes con esa búsqueda.</Nota> : (
              <Tarjeta>
                {r.paquetes.map((p, i) => (
                  <Fila key={p.id} primera={i === 0} t={p.nombre}
                    sub={`${p.descripcion}\n${p.tipo === 'voz' ? 'Voz' : 'Perfil'} de ${p.autor}, ${p.descargas} descargas`}>
                    <Mini t="Descargar" fn={async () => { await descargar(p.id); buscar(); }} />
                    {p.autor === nube.usuario() && <Mini t="Retirar" tono="peligro" fn={() => confirmar('¿Retirar de la tienda?', async () => {
                      await nube.api(`/marketplace/${p.id}`, { metodo: 'DELETE' });
                      buscar();
                    }, 'Retirar')} />}
                  </Fila>
                ))}
              </Tarjeta>
            )}
          </>
        )}
    </>
  );
}
