import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Text, View } from 'react-native';
import { inicialDe } from '../../../dominio/textos';
import { e } from '../../../estilos/comunes';
import { t } from '../../../estilos/asistente';
import { DEGRADADO_BOTON, DEGRADADO_RIESGO } from '../../../estilos/tema';
import type { Respuesta } from '../../../servicios/asistente/ServicioAsistente';
import { useApp } from '../../contexto';
import { pedirAyuda } from '../../formularios/red';
import { Mini, Primario } from '../botones';
import { Chips } from '../cajas';

const origenDe = (r: Respuesta) => {
  if (r.plan.riesgo) return 'Posible peligro';
  if (r.origen === 'nube') return 'IA generativa';
  return r.confianza ? `IA del teléfono, ${Math.round(r.confianza * 100)}% de certeza` : 'IA del teléfono';
};

function Emergencia() {
  const app = useApp();
  return (
    <View style={t.emergencia}>
      <Text style={e.texto}>Si estás en peligro, no uses solo la llamada falsa.</Text>
      <Chips>
        <Mini t="Marcar al 911" tono="peligro" fn={() => Linking.openURL('tel:911')} />
        <Mini t="Avisar a cómplices" fn={() => (app.cuenta.usuario ? pedirAyuda(app) : app.navegacion.ir('complices'))} />
      </Chips>
    </View>
  );
}

export function TarjetaPlan({ r }: { r: Respuesta }) {
  const { asistente, avisos } = useApp();
  const { plan } = r;
  const { nombre, etiqueta, voz } = plan.llamada;
  const llamar = { t: 'Llamarme ya', fn: () => asistente.usar(r, 'llamada') };
  const mensajes = { t: 'Mandarme los mensajes', fn: () => asistente.usar(r, 'bomba') };
  const [primero, segundo] = plan.accion === 'llamada' ? [llamar, mensajes] : [mensajes, llamar];
  const guardar = () => {
    asistente.guardar(r);
    avisos.mostrar('Guardado. Ahora es tu escape predeterminado.');
  };
  return (
    <View style={[t.tarjeta, plan.riesgo && t.riesgo]}>
      <LinearGradient colors={plan.riesgo ? DEGRADADO_RIESGO : DEGRADADO_BOTON} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={t.cabeza}>
        <Text style={t.titulo} accessibilityRole="header">{plan.titulo}</Text>
        <Text style={t.origen}>{origenDe(r)}</Text>
      </LinearGradient>
      <View style={t.cuerpo}>
        {plan.riesgo && <Emergencia />}
        <Text style={e.texto}>{plan.consejo}</Text>
        <View style={t.quien}>
          <View style={t.avatar}><Text style={t.inicial}>{inicialDe(nombre)}</Text></View>
          <View style={e.crece}><Text style={e.fuerte}>{nombre}</Text><Text style={e.chico}>{etiqueta}, te dirá:</Text></View>
        </View>
        <View style={t.guion}>{voz.guion.map((f, i) => <Text key={i} style={t.frase}>{f}</Text>)}</View>
        <Primario t={primero.t} fn={primero.fn} />
        <Chips>
          <Mini t={segundo.t} fn={segundo.fn} />
          {r.guardado ? <Text style={e.chico}>Guardado</Text> : <Mini t="Guardar" fn={guardar} />}
          {!plan.riesgo && <Mini t="Otra idea" fn={() => asistente.otraIdea(r)} />}
        </Chips>
        {r.nota && <Text style={e.chico}>{r.nota}</Text>}
      </View>
    </View>
  );
}
