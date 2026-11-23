// Formulario emergente que se arma a partir de una lista de campos.
import { useEffect, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { cerrarFormulario, type Campo, type DatosFormulario, type Valores } from '../estado';
import { C, e, Interruptor, Mini, Opciones, Primario } from '../ui';

export function Formulario({ datos }: { datos: DatosFormulario }) {
  const [valores, setValores] = useState<Valores>(() =>
    Object.fromEntries(datos.campos.map((c) => [c.id, String(c.valor ?? '')])));
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const poner = (v: Valores) => setValores((antes) => ({ ...antes, ...v }));

  useEffect(() => {
    const atras = BackHandler.addEventListener('hardwareBackPress', () => { cerrarFormulario(); return true; });
    return () => atras.remove();
  }, []);

  async function proteger(fn: () => void | Promise<void>) {
    setError('');
    setOcupado(true);
    try { await fn(); } catch (x) { setError((x as Error).message); } finally { setOcupado(false); }
  }
  const guardar = () => proteger(async () => {
    const limpios: Valores = {};
    for (const c of datos.campos) {
      const v = c.tipo === 'clave' ? valores[c.id] : valores[c.id].trim();
      if (!v && c.tipo !== 'si') throw new Error(`Falta: ${c.label}.`);
      // Se admite coma decimal, que es lo que trae el teclado en español.
      const n = v.replace(',', '.');
      if (c.tipo === 'numero' && !Number.isFinite(Number(n))) throw new Error(`Escribe un número en: ${c.label}.`);
      limpios[c.id] = c.tipo === 'numero' ? n : v;
    }
    await datos.guardar(limpios);
    cerrarFormulario(datos);
  });

  const entrada = (c: Campo) => {
    if (c.tipo === 'opciones') return <Opciones t={c.label} opciones={c.opciones ?? []} valor={valores[c.id]} fn={(v) => poner({ [c.id]: v })} />;
    if (c.tipo === 'si') return <Interruptor t={c.label} valor={valores[c.id] === '1'} fn={(v) => poner({ [c.id]: v ? '1' : '' })} />;
    return (
      <View style={{ gap: 6 }}>
        <Text style={e.nota}>{c.label}</Text>
        <TextInput style={[e.campo, c.tipo === 'area' && { minHeight: 110, textAlignVertical: 'top' }]} accessibilityLabel={c.label}
          value={valores[c.id]} onChangeText={(v) => poner({ [c.id]: v })} maxLength={c.max} placeholder={c.ayuda}
          placeholderTextColor="#68748d" multiline={c.tipo === 'area'} secureTextEntry={c.tipo === 'clave'}
          autoCapitalize={c.id === 'usuario' || c.tipo === 'clave' ? 'none' : 'sentences'} autoCorrect={c.id !== 'usuario'}
          keyboardType={c.tipo === 'numero' ? 'numbers-and-punctuation' : 'default'} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={[StyleSheet.absoluteFill, s.fondo]}>
      <View style={s.caja} accessibilityViewIsModal>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 14, padding: 20 }}>
          <Text style={e.h2} accessibilityRole="header">{datos.titulo}</Text>
          {datos.campos.map((c) => (
            <View key={c.id} style={{ gap: 8 }}>
              {entrada(c)}
              {c.extra && <Mini t={c.extra.texto} fn={() => proteger(async () => poner(await c.extra!.accion()))} />}
            </View>
          ))}
          {error !== '' && <Text style={{ color: C.rojo }} accessibilityLiveRegion="polite">{error}</Text>}
          <View style={s.acciones}>
            <Pressable accessibilityRole="button" onPress={() => cerrarFormulario()} style={{ padding: 12 }}><Text style={e.texto}>Cancelar</Text></Pressable>
            <Primario t={ocupado ? 'Espera…' : 'Guardar'} ocupado={ocupado} fn={guardar} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  fondo: { backgroundColor: '#000b', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 40 },
  caja: { backgroundColor: C.panel, borderRadius: 18, borderWidth: 1, borderColor: C.linea, flexShrink: 1 },
  acciones: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
});
