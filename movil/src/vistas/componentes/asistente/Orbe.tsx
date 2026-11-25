import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { o } from '../../../estilos/asistente';
import { C, DEGRADADO_BOTON } from '../../../estilos/tema';
import { Icono } from '../Icono';

// La cara de Houdini IA: respira, y más rápido cuando piensa.
export function Orbe({ lado, rapido = false }: { lado: number; rapido?: boolean }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let vivo = true;
    const duration = rapido ? 550 : 1700;
    const ida = (toValue: number) => Animated.timing(v, { toValue, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true });
    const ciclo = Animated.loop(Animated.sequence([ida(1), ida(0)]));
    AccessibilityInfo.isReduceMotionEnabled().then((quieto) => { if (vivo && !quieto) ciclo.start(); });
    return () => { vivo = false; ciclo.stop(); };
  }, [rapido]);
  const redondo = (n: number) => ({ width: n, height: n, borderRadius: n / 2 });
  const crece = (hasta: number) => ({ transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, hasta] }) }] });
  return (
    <View style={[o.caja, redondo(lado * 1.35)]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Animated.View style={[o.halo, redondo(lado * 1.1), crece(1.22)]} />
      <Animated.View style={[o.orbe, redondo(lado), crece(1.05)]}>
        <LinearGradient colors={DEGRADADO_BOTON} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={[o.orbe, redondo(lado)]}>
          <Icono nombre="destello" color={C.blanco} lado={lado * 0.5} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
