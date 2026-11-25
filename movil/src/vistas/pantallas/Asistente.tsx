import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { s } from '../../estilos/asistente';
import { e } from '../../estilos/comunes';
import { C, DEGRADADO_BOTON } from '../../estilos/tema';
import { Aparecer } from '../componentes/Aparecer';
import { Orbe } from '../componentes/asistente/Orbe';
import { TarjetaPlan } from '../componentes/asistente/TarjetaPlan';
import { Mini } from '../componentes/botones';
import { Chips } from '../componentes/cajas';
import { Icono } from '../componentes/Icono';
import { Nota } from '../componentes/textos';
import { useApp } from '../contexto';

const IDEAS = [
  ['🍷', 'Mi cita no va nada bien'], ['💼', 'Una junta que no termina'], ['👵', 'Comida familiar con preguntas incómodas'], ['🛍️', 'Un vendedor que no me suelta'],
];

function Bienvenida() {
  const { asistente } = useApp();
  return (
    <>
      <View style={s.portada}>
        <Orbe lado={92} />
        <Text style={s.saludo} accessibilityRole="header">¿De dónde te saco?</Text>
        <Text style={[e.nota, s.centro]}>Cuéntame tu situación y te armo una llamada o mensajes creíbles.</Text>
      </View>
      <View style={s.ideas}>
        {IDEAS.map(([emoji, texto]) => (
          <Pressable key={texto} accessibilityRole="button" onPress={() => asistente.preguntar(texto)} style={({ pressed }) => [s.idea, pressed && e.presionado]}>
            <Text style={s.emoji}>{emoji}</Text>
            <Text style={[e.texto, e.crece]}>{texto}</Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

function Escribir() {
  const { asistente } = useApp();
  const [texto, setTexto] = useState('');
  const listo = texto.trim() !== '' && !asistente.pensando;
  const enviar = () => {
    if (!listo) return;
    setTexto('');
    Keyboard.dismiss();
    asistente.preguntar(texto);
  };
  return (
    <View style={s.barra}>
      <TextInput style={[e.campo, s.campo]} placeholder="¿Qué está pasando?" placeholderTextColor={C.suave} accessibilityLabel="Tu situación"
        value={texto} onChangeText={setTexto} maxLength={400} multiline />
      <Pressable accessibilityRole="button" accessibilityLabel="Enviar" accessibilityState={{ disabled: !listo }} disabled={!listo} onPress={enviar}>
        <LinearGradient colors={DEGRADADO_BOTON} style={[s.enviar, !listo && s.apagado]}><Icono nombre="enviar" color={C.blanco} /></LinearGradient>
      </Pressable>
    </View>
  );
}

export function Asistente() {
  const { asistente } = useApp();
  const lista = useRef<ComponentRef<typeof ScrollView>>(null);
  const { mensajes, pensando, usaNube } = asistente;
  const vacia = mensajes.length === 0;
  const ultimo = mensajes.at(-1);
  const mostrado = useRef(0);
  // La respuesta se ve desde su inicio: ahí está el consejo.
  const mostrar = (y: number) => {
    if (ultimo?.de !== 'ia' || mostrado.current === ultimo.id) return;
    mostrado.current = ultimo.id;
    lista.current?.scrollTo({ y: y - 8, animated: true });
  };
  return (
    <View style={s.pantalla}>
      <ScrollView ref={lista} keyboardShouldPersistTaps="handled" contentContainerStyle={s.lista}
        onContentSizeChange={() => { if (pensando) lista.current?.scrollToEnd({ animated: true }); }}>
        {vacia && <Bienvenida />}
        {mensajes.map((m) => (
          <View key={m.id} onLayout={(ev) => { if (m === ultimo) mostrar(ev.nativeEvent.layout.y); }}>
            <Aparecer>{m.de === 'yo' ? <View style={s.yo}><Text style={s.yoTexto}>{m.texto}</Text></View> : <TarjetaPlan r={m.respuesta} />}</Aparecer>
          </View>
        ))}
        {pensando && (
          <View style={s.pensando} accessibilityLiveRegion="polite">
            <Orbe lado={34} rapido />
            <Nota>{usaNube ? 'Pensando… si la nube dormía puede tardar.' : 'Pensando tu escape…'}</Nota>
          </View>
        )}
        {!vacia && !pensando && <Chips><Mini t="Empezar de nuevo" fn={() => asistente.limpiar()} /></Chips>}
      </ScrollView>
      <Escribir />
      <Text style={s.pie}>{usaNube ? 'IA en la nube: tu texto se envía a Claude.' : 'IA del teléfono: tu texto no sale de aquí.'}</Text>
    </View>
  );
}
