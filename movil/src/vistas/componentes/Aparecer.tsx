import { useEffect, useRef, type ReactNode } from 'react';
import { Animated } from 'react-native';

// Entra con un desvanecido suave.
export function Aparecer({ children }: { children: ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }).start(); }, []);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  return <Animated.View style={{ opacity: v, transform: [{ translateY }] }}>{children}</Animated.View>;
}
