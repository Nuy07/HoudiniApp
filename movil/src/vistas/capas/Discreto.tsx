// Rescate discreto: pantalla negra que parece apagada.
import { useKeepAwake } from 'expo-keep-awake';
import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { s } from '../../estilos/discreto';
import { useContenedor } from '../contexto';
import { useBotonAtras } from '../ganchos/useBotonAtras';

export function Discreto() {
  useKeepAwake();
  const { discreto } = useContenedor();
  const opacidad = useRef(new Animated.Value(1)).current;
  useBotonAtras(() => { discreto.salir(); return true; });

  useEffect(() => {
    Animated.timing(opacidad, { toValue: 0, delay: 2000, duration: 1000, useNativeDriver: true }).start();
  }, []);

  return (
    <Pressable accessibilityLabel="Modo discreto: tres toques activan el escape, mantener presionado sale"
      onPressIn={() => discreto.tocar()} onLongPress={() => discreto.salir()} delayLongPress={1800} style={[StyleSheet.absoluteFill, s.negro]}>
      <StatusBar hidden />
      <NavigationBar hidden />
      <Animated.View style={{ opacity: opacidad }}>
        <Text style={s.texto}>3 toques activan el escape.{'\n'}Mantén presionado para salir.</Text>
      </Animated.View>
    </Pressable>
  );
}
