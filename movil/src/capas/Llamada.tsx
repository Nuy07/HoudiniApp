// Pantalla de llamada falsa, con apariencia de Android o de iOS.
import { useKeepAwake } from 'expo-keep-awake';
import { Accelerometer } from 'expo-sensors';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as db from '../db';
import { colgar, pararTono, sistema, sonarTono, type DatosLlamada } from '../escape';
import { Icono } from '../ui';

// Va diciendo el guion, con una pausa entre frases para que puedas "responder".
function hablar(p: DatosLlamada) {
  let vivo = true;
  let espera: ReturnType<typeof setTimeout>;
  const decir = (i: number) => {
    if (!vivo || i >= p.guion.length) return;
    const seguir = () => { if (vivo) espera = setTimeout(() => decir(i + 1), 2500); };
    Speech.speak(p.guion[i], { language: 'es-MX', rate: p.rate, pitch: p.pitch, onDone: seguir, onError: seguir });
  };
  espera = setTimeout(() => decir(0), 700);
  return () => { vivo = false; clearTimeout(espera); Speech.stop(); };
}

function Boton({ color, texto, fn, girado }: { color: string; texto: string; fn: () => void; girado?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={texto} onPress={fn} style={s.boton}>
      <View style={[s.circulo, { backgroundColor: color }, girado && { transform: [{ rotate: '135deg' }] }]}>
        <Icono nombre="tel" color="#fff" lado={32} relleno />
      </View>
      <Text style={s.botonTexto}>{texto}</Text>
    </Pressable>
  );
}
function Alternar({ texto }: { texto: string }) {
  const [si, setSi] = useState(false);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={texto} accessibilityState={{ checked: si }} onPress={() => setSi(!si)} style={s.boton}>
      <View style={[s.circulo, { backgroundColor: si ? '#fff' : '#ffffff26' }]}>
        <Text style={{ fontSize: 24, color: si ? '#000' : '#fff' }}>{texto[0]}</Text>
      </View>
      <Text style={s.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

export function Llamada({ datos }: { datos: DatosLlamada }) {
  useKeepAwake();
  const margen = useSafeAreaInsets();
  const [estilo] = useState(sistema);
  const [inicio, setInicio] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [oculta, setOculta] = useState(false);
  const callar = useRef<(() => void) | null>(null);
  const enCurso = inicio > 0;

  useEffect(() => {
    sonarTono();
    // El botón "atrás" no cierra la llamada, igual que en una real.
    const atras = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { pararTono(); callar.current?.(); callar.current = null; atras.remove(); };
  }, []);

  useEffect(() => {
    if (!enCurso) return;
    pararTono();
    const empezar = () => { callar.current ??= hablar(datos); };
    const t = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);
    let sensor: { remove: () => void } | undefined;
    let vivo = true;
    let respaldo: ReturnType<typeof setTimeout> | undefined;

    // Audio por proximidad: la voz empieza al llevar el teléfono al oído.
    // Expo no expone el sensor de proximidad, así que se usa la inclinación.
    if (db.config('proximidad', '1') === '1') {
      (async () => {
        if (!(await Accelerometer.isAvailableAsync().catch(() => false))) return empezar();
        if (!vivo) return;
        let antes = false;
        Accelerometer.setUpdateInterval(100);
        sensor = Accelerometer.addListener(({ x, y }) => {
          const oido = Math.abs(x) > 0.75 || Math.abs(y) > 0.93;
          if (oido === antes) return;
          antes = oido;
          setOculta(oido);
          if (oido) empezar();
        });
        // Si nunca se acerca al oído (manos libres), habla igual.
        respaldo = setTimeout(empezar, 6000);
      })();
    } else empezar();

    return () => { vivo = false; clearInterval(t); clearTimeout(respaldo); sensor?.remove(); };
  }, [enCurso]);

  const dos = (n: number) => String(n).padStart(2, '0');
  const estado = enCurso ? `${dos(Math.floor(segundos / 60))}:${dos(segundos % 60)}`
    : estilo === 'ios' ? datos.etiqueta.toLowerCase() : 'Llamada entrante';
  const avatar = (
    <View style={[s.avatar, { backgroundColor: estilo === 'ios' ? '#6b7280' : '#1a73e8' }]}>
      <Text style={s.inicial}>{[...datos.nombre.trim()][0]?.toUpperCase() ?? '?'}</Text>
    </View>
  );

  return (
    <LinearGradient colors={estilo === 'ios' ? ['#3b4252', '#15181f'] : ['#10151c', '#10151c']} locations={[0, 0.7]}
      style={[StyleSheet.absoluteFill, s.pantalla, { paddingTop: margen.top + 70, paddingBottom: margen.bottom + 50 }]}>
      <StatusBar style="light" hidden={oculta} />
      <View style={{ alignItems: 'center' }}>
        {estilo === 'ios' && avatar}
        <Text style={s.nombre} numberOfLines={2}>{datos.nombre}</Text>
        <Text style={s.estado}>{estado}</Text>
        {estilo === 'android' && !enCurso && <Text style={s.estado}>{datos.etiqueta}</Text>}
        {estilo === 'android' && avatar}
      </View>
      {enCurso ? (
        <View style={{ gap: 36, width: '100%' }}>
          <View style={s.acciones}><Alternar texto="Silenciar" /><Alternar texto="Teclado" /><Alternar texto="Altavoz" /></View>
          <View style={s.acciones}><Boton color="#e0352b" texto="Colgar" fn={colgar} girado /></View>
        </View>
      ) : (
        <View style={s.acciones}>
          <Boton color="#e0352b" texto="Rechazar" fn={colgar} girado />
          <Boton color="#22a047" texto={estilo === 'ios' ? 'Aceptar' : 'Contestar'} fn={() => setInicio(Date.now())} />
        </View>
      )}
      {/* En el oído la pantalla se apaga. Un toque la devuelve. */}
      {oculta && <Pressable accessibilityLabel="Mostrar llamada" onPress={() => setOculta(false)} style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />}
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  pantalla: { alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginVertical: 24 },
  inicial: { color: '#fff', fontSize: 46 },
  nombre: { color: '#fff', fontSize: 34, textAlign: 'center' },
  estado: { color: '#d1d5db', fontSize: 17, marginTop: 4 },
  acciones: { width: '100%', flexDirection: 'row', justifyContent: 'space-around' },
  boton: { alignItems: 'center', gap: 8, minWidth: 80 },
  circulo: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  botonTexto: { color: '#fff', fontSize: 14 },
});
