// Patrones de uso con COUNT y GROUP BY sobre la base local.
import { StyleSheet, Text, View } from 'react-native';
import * as db from '../db';
import { nombreAccion, nombreGatillo } from '../textos';
import { C, Chips, confirmar, e, Mini, Nota, Par, Tarjeta, Titulo } from '../ui';

const DIAS = [['1', 'Lun'], ['2', 'Mar'], ['3', 'Mié'], ['4', 'Jue'], ['5', 'Vie'], ['6', 'Sáb'], ['0', 'Dom']];
const COLOR_FINDE = '#0e9f6e';
const esFinde = (d: string) => d === '0' || d === '6';

function cargarDemo() {
  for (let i = 0; i < 30; i++) {
    const fecha = new Date(Date.now() - Math.floor(Math.random() * 28) * 86400000);
    db.registrar(i % 3 ? 'llamada' : 'bomba', 'demo', 'Ejemplo', fecha);
  }
}

export function Historial() {
  const total = db.cuantos('historial');
  if (!total) {
    return (
      <>
        <Titulo t="Historial de evasión" />
        <Tarjeta>
          <Nota>Aún no hay escapes. Activa uno para ver tus patrones.</Nota>
          <Chips><Mini t="Cargar datos de ejemplo" fn={cargarDemo} /></Chips>
        </Tarjeta>
      </>
    );
  }
  type Conteo = { k: string; n: number };
  const demo = db.cuantos("historial WHERE gatillo = 'demo'");
  const porDia = db.todos<Conteo>("SELECT strftime('%w', fecha) AS k, COUNT(*) AS n FROM historial GROUP BY k");
  const porTipo = db.todos<Conteo>('SELECT tipo AS k, COUNT(*) AS n FROM historial GROUP BY tipo ORDER BY n DESC');
  const porGatillo = db.todos<Conteo>('SELECT gatillo AS k, COUNT(*) AS n FROM historial GROUP BY gatillo ORDER BY n DESC');
  const recientes = db.todos<db.Registro>('SELECT * FROM historial ORDER BY fecha DESC, id DESC LIMIT 10');
  const cuenta = new Map(porDia.map((d) => [d.k, d.n]));
  const finde = (cuenta.get('0') ?? 0) + (cuenta.get('6') ?? 0);
  const max = Math.max(1, ...cuenta.values());

  return (
    <>
      <Titulo t="Historial de evasión" />
      {demo > 0 && (
        <View style={e.cabeza}>
          <Text style={{ color: '#fcd34d', flexShrink: 1 }}>Incluye {demo} registros de ejemplo.</Text>
          <Mini t="Quitar" fn={() => db.ejecutar("DELETE FROM historial WHERE gatillo = 'demo'")} />
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={[e.tarjeta, s.cifra]}><Text style={s.numero}>{total}</Text><Text style={e.chico}>{total === 1 ? 'escape en total' : 'escapes en total'}</Text></View>
        <View style={[e.tarjeta, s.cifra]}><Text style={s.numero}>{Math.round((finde / total) * 100)}%</Text><Text style={e.chico}>en fin de semana</Text></View>
      </View>
      <Tarjeta titulo="Escapes por día">
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {[[C.morado, 'Entre semana'], [COLOR_FINDE, 'Fin de semana']].map(([color, t]) => (
            <View key={t} style={s.leyenda}><View style={[s.punto, { backgroundColor: color }]} /><Text style={e.chico}>{t}</Text></View>
          ))}
        </View>
        <View style={s.barras} accessible accessibilityRole="image" accessibilityLabel={DIAS.map(([k, t]) => `${t}: ${cuenta.get(k) ?? 0}`).join(', ')}>
          {DIAS.map(([k, t]) => {
            const n = cuenta.get(k) ?? 0;
            return (
              <View key={k} style={s.columna}>
                <Text style={e.chico}>{n}</Text>
                <View style={[s.barra, { height: (n / max) * 110, backgroundColor: esFinde(k) ? COLOR_FINDE : C.morado }]} />
                <View style={s.eje}><Text style={e.chico}>{t}</Text></View>
              </View>
            );
          })}
        </View>
      </Tarjeta>
      <Tarjeta titulo="Escapes más usados">{porTipo.map((x) => <Par key={x.k} a={nombreAccion(x.k)} b={x.n} />)}</Tarjeta>
      <Tarjeta titulo="Cómo los activaste">{porGatillo.map((x) => <Par key={x.k} a={nombreGatillo(x.k)} b={x.n} />)}</Tarjeta>
      <Tarjeta titulo="Recientes">{recientes.map((x) => <Par key={x.id} a={`${nombreAccion(x.tipo)}: ${x.detalle}`} b={x.fecha.slice(0, 16)} />)}</Tarjeta>
      <Chips>
        {demo === 0 && <Mini t="Cargar datos de ejemplo" fn={cargarDemo} />}
        <Mini t="Borrar historial" tono="peligro" fn={() => confirmar('¿Borrar todo el historial?', () => db.ejecutar('DELETE FROM historial'), 'Borrar')} />
      </Chips>
    </>
  );
}

const s = StyleSheet.create({
  cifra: { flex: 1, gap: 0 },
  numero: { color: C.texto, fontSize: 32, fontWeight: '800' },
  leyenda: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: 10, height: 10, borderRadius: 3 },
  barras: { flexDirection: 'row', alignItems: 'flex-end' },
  columna: { flex: 1, alignItems: 'center' },
  barra: { width: 22, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  eje: { alignSelf: 'stretch', alignItems: 'center', borderTopWidth: 1, borderTopColor: C.linea, paddingTop: 4 },
});
