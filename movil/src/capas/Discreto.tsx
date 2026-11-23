// Rescate discreto: pantalla negra que parece apagada.
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text } from 'react-native';
import { lanzarPreferido } from '../escape';
import { discreto, rafaga } from '../gatillos';

export function Discreto() {
  useKeepAwake();
  const opacidad = useRef(new Animated.Value(1)).current;
  const toque = useRef(rafaga(3, 1500, () => { discreto(false); lanzarPreferido('discreto'); })).current;

  useEffect(() => {
    Animated.timing(opacidad, { toValue: 0, delay: 2000, duration: 1000, useNativeDriver: true }).start();
    const atras = BackHandler.addEventListener('hardwareBackPress', () => { discreto(false); return true; });
    return () => atras.remove();
  }, []);

  return (
    <Pressable accessibilityLabel="Modo discreto: tres toques activan el escape, mantener presionado sale"
      onPressIn={toque} onLongPress={() => discreto(false)} delayLongPress={1800} style={[StyleSheet.absoluteFill, s.negro]}>
      <StatusBar hidden />
      <NavigationBar hidden />
      <Animated.View style={{ opacity: opacidad }}>
        <Text style={s.texto}>3 toques activan el escape.{'\n'}Mantén presionado para salir.</Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  negro: { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  texto: { color: '#777', textAlign: 'center', fontSize: 15, lineHeight: 22 },
});
