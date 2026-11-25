// Formulario emergente que se arma a partir de una lista de campos.
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Formularios, type Campo, type DatosFormulario, type Valores } from '../../estado/Formularios';
import { e } from '../../estilos/comunes';
import { s } from '../../estilos/formulario';
import { C } from '../../estilos/tema';
import { Mini, Primario } from '../componentes/botones';
import { Interruptor, Opciones } from '../componentes/entradas';
import { useContenedor } from '../contexto';
import { useBotonAtras } from '../ganchos/useBotonAtras';

function Entrada({ c, valor, fn }: { c: Campo; valor: string; fn: (v: string) => void }) {
  const literal = c.tipo === 'clave' || c.id === 'usuario' || c.id === 'url'; // se escribe tal cual, sin autocorrector
  if (c.tipo === 'opciones') return <Opciones t={c.label} opciones={c.opciones ?? []} valor={valor} fn={fn} />;
  if (c.tipo === 'si') return <Interruptor t={c.label} valor={valor === '1'} fn={(v) => fn(v ? '1' : '')} />;
  return (
    <View style={e.grupo}>
      <Text style={e.nota}>{c.label}</Text>
      <TextInput style={[e.campo, c.tipo === 'area' && s.area]} accessibilityLabel={c.label}
        value={valor} onChangeText={fn} maxLength={c.max} placeholder={c.ayuda}
        placeholderTextColor={C.marcador} multiline={c.tipo === 'area'} secureTextEntry={c.tipo === 'clave'}
        autoCapitalize={literal ? 'none' : 'sentences'} autoCorrect={!literal}
        keyboardType={c.tipo === 'numero' ? 'numbers-and-punctuation' : 'default'} />
    </View>
  );
}

export function Formulario({ datos }: { datos: DatosFormulario }) {
  const { formularios } = useContenedor();
  const [valores, setValores] = useState<Valores>(() =>
    Object.fromEntries(datos.campos.map((c) => [c.id, String(c.valor ?? '')])));
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const poner = (v: Valores) => setValores((antes) => ({ ...antes, ...v }));
  useBotonAtras(() => { formularios.cerrar(); return true; });

  async function proteger(fn: () => void | Promise<void>) {
    setError('');
    setOcupado(true);
    try { await fn(); } catch (x) { setError((x as Error).message); } finally { setOcupado(false); }
  }
  const guardar = () => proteger(async () => {
    await datos.guardar(Formularios.limpiar(datos.campos, valores));
    formularios.cerrar(datos);
  });

  return (
    <KeyboardAvoidingView behavior="padding" style={[StyleSheet.absoluteFill, s.fondo]}>
      <View style={s.caja} accessibilityViewIsModal>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.contenido}>
          <Text style={e.h2} accessibilityRole="header">{datos.titulo}</Text>
          {datos.campos.map((c) => (
            <View key={c.id} style={s.campo}>
              <Entrada c={c} valor={valores[c.id]} fn={(v) => poner({ [c.id]: v })} />
              {c.extra && <Mini t={c.extra.texto} fn={() => proteger(async () => poner(await c.extra!.accion()))} />}
            </View>
          ))}
          {error !== '' && <Text style={e.error} accessibilityLiveRegion="polite">{error}</Text>}
          <View style={s.acciones}>
            <Pressable accessibilityRole="button" onPress={() => formularios.cerrar()} style={s.cancelar}><Text style={e.texto}>Cancelar</Text></Pressable>
            <Primario t={ocupado ? 'Espera…' : 'Guardar'} ocupado={ocupado} fn={guardar} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
