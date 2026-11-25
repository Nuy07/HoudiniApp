import { useState } from 'react';
import { TextInput } from 'react-native';
import type { Paquete } from '../../dominio/modelos';
import { e } from '../../estilos/comunes';
import { C } from '../../estilos/tema';
import { s } from '../../estilos/tienda';
import { Mini } from '../componentes/botones';
import { Fila, Tarjeta } from '../componentes/cajas';
import { Opciones } from '../componentes/entradas';
import { EsperaServidor } from '../componentes/EsperaServidor';
import { Nota, Titulo } from '../componentes/textos';
import { useApp } from '../contexto';
import { useConfirmar } from '../ganchos/useConfirmar';
import { useConsulta } from '../ganchos/useConsulta';

const TIPOS: [string, string][] = [['', 'Todo'], ['voz', 'Voces'], ['perfil', 'Perfiles']];
const ESPERA_AL_ESCRIBIR = 250;

export function Tienda() {
  const { tienda, cuenta, avisos } = useApp();
  const confirmar = useConfirmar();
  const [tipo, setTipo] = useState('');
  const [q, setQ] = useState('');
  const { datos, error, recargar } = useConsulta(() => tienda.buscar(tipo, q), [tipo, q], ESPERA_AL_ESCRIBIR);

  const total = (t: string) => datos?.totales.find((x) => x.tipo === t)?.total ?? 0;
  const descargar = async (p: Paquete) => {
    await tienda.descargar(p.id);
    avisos.mostrar('Guardado en Perfiles. Ya funciona sin internet.');
    recargar();
  };
  const retirar = (p: Paquete) => confirmar('¿Retirar de la tienda?', async () => {
    await tienda.retirar(p.id);
    recargar();
  }, 'Retirar');

  return (
    <>
      <Titulo t="Tienda" sub="Perfiles y voces de la comunidad." />
      <TextInput style={[e.campo, s.buscador]} placeholder="Buscar paquetes" placeholderTextColor={C.suave}
        accessibilityLabel="Buscar paquetes" maxLength={60} value={q} onChangeText={setQ} returnKeyType="search" />
      <Opciones opciones={TIPOS} valor={tipo} fn={setTipo} />
      {error !== '' ? <Tarjeta><EsperaServidor error={error} reintentar={recargar} /></Tarjeta>
        : !datos ? <EsperaServidor error="" reintentar={recargar} /> : (
          <>
            <Nota>{total('voz')} voces y {total('perfil')} perfiles publicados</Nota>
            {datos.paquetes.length === 0 ? <Nota>No hay paquetes con esa búsqueda.</Nota> : (
              <Tarjeta>
                {datos.paquetes.map((p, i) => (
                  <Fila key={p.id} primera={i === 0} t={p.nombre}
                    sub={`${p.descripcion}\n${p.tipo === 'voz' ? 'Voz' : 'Perfil'} de ${p.autor}, ${p.descargas} descargas`}>
                    <Mini t="Descargar" fn={() => descargar(p)} />
                    {p.autor === cuenta.usuario && <Mini t="Retirar" tono="peligro" fn={() => retirar(p)} />}
                  </Fila>
                ))}
              </Tarjeta>
            )}
          </>
        )}
    </>
  );
}
