// Pantalla de llamada falsa, con apariencia de Android o de iOS.
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DatosLlamada } from '../../dominio/modelos';
import { duracion, inicialDe } from '../../dominio/textos';
import { s } from '../../estilos/llamada';
import { C, LLAMADA } from '../../estilos/tema';
import { Icono } from '../componentes/Icono';
import { useContenedor } from '../contexto';
import { useBotonAtras } from '../ganchos/useBotonAtras';
import { useLlamada } from '../ganchos/useLlamada';

function Boton({ color, texto, fn, girado }: { color: string; texto: string; fn: () => void; girado?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={texto} onPress={fn} style={s.boton}>
      <View style={[s.circulo, { backgroundColor: color }, girado && s.girado]}>
        <Icono nombre="tel" color={C.blanco} lado={32} relleno />
      </View>
      <Text style={s.botonTexto}>{texto}</Text>
    </Pressable>
  );
}
function Alternar({ texto }: { texto: string }) {
  const [si, setSi] = useState(false);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={texto} accessibilityState={{ checked: si }} onPress={() => setSi(!si)} style={s.boton}>
      <View style={[s.circulo, { backgroundColor: si ? C.blanco : LLAMADA.alternar }]}>
        <Text style={[s.letra, { color: si ? C.negro : C.blanco }]}>{texto[0]}</Text>
      </View>
      <Text style={s.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

export function Llamada({ datos }: { datos: DatosLlamada }) {
  useKeepAwake();
  const margen = useSafeAreaInsets();
  const { llamada } = useContenedor();
  const { estilo, enCurso, segundos, oculta, contestar, mostrar } = useLlamada(datos);
  // El botón "atrás" no cierra la llamada, igual que en una real.
  useBotonAtras(() => true);
  const colgar = () => llamada.detener();
  const ios = estilo === 'ios';
  const estado = enCurso ? duracion(segundos) : ios ? datos.etiqueta.toLowerCase() : 'Llamada entrante';
  const avatar = (
    <View style={[s.avatar, { backgroundColor: LLAMADA[estilo].avatar }]}><Text style={s.inicial}>{inicialDe(datos.nombre)}</Text></View>
  );

  return (
    <LinearGradient colors={LLAMADA[estilo].fondo} locations={[0, 0.7]}
      style={[StyleSheet.absoluteFill, s.pantalla, { paddingTop: margen.top + 70, paddingBottom: margen.bottom + 50 }]}>
      <StatusBar style="light" hidden={oculta} />
      <View style={s.quien}>
        {ios && avatar}
        <Text style={s.nombre} numberOfLines={2}>{datos.nombre}</Text>
        <Text style={s.estado}>{estado}</Text>
        {!ios && !enCurso && <Text style={s.estado}>{datos.etiqueta}</Text>}
        {!ios && avatar}
      </View>
      {enCurso ? (
        <View style={s.enCurso}>
          <View style={s.acciones}><Alternar texto="Silenciar" /><Alternar texto="Teclado" /><Alternar texto="Altavoz" /></View>
          <View style={s.acciones}><Boton color={LLAMADA.colgar} texto="Colgar" fn={colgar} girado /></View>
        </View>
      ) : (
        <View style={s.acciones}>
          <Boton color={LLAMADA.colgar} texto="Rechazar" fn={colgar} girado />
          <Boton color={LLAMADA.contestar} texto={ios ? 'Aceptar' : 'Contestar'} fn={contestar} />
        </View>
      )}
      {/* En el oído la pantalla se apaga. Un toque la devuelve. */}
      {oculta && <Pressable accessibilityLabel="Mostrar llamada" onPress={mostrar} style={[StyleSheet.absoluteFill, s.apagada]} />}
    </LinearGradient>
  );
}
