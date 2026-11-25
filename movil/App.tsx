// Punto de entrada: arma la app, la inicia y la muestra.
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { LogBox, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { crearContenedor } from './src/contenedor';
import { s } from './src/estilos/aplicacion';
import { e } from './src/estilos/comunes';
import { Aplicacion } from './src/vistas/Aplicacion';
import { ProveedorApp } from './src/vistas/contexto';

// Expo Go avisa que no hay notificaciones push (esta app no las usa) y en Android no deja
// crear canales: ahí las notificaciones salen por el canal general.
LogBox.ignoreLogs([/expo-notifications/, /Canal de notificaciones/]);

const contenedor = crearContenedor();

export default function App() {
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando');
  useEffect(() => {
    contenedor.iniciar().then(() => setEstado('lista'), (x) => { console.error(x); setEstado('error'); });
  }, []);
  return (
    <SafeAreaProvider style={s.app}>
      {estado === 'lista' ? <ProveedorApp value={contenedor}><Aplicacion /></ProveedorApp> : (
        <View style={s.espera}>
          <StatusBar style="light" />
          <Text style={e.nota}>{estado === 'error' ? 'No se pudo abrir la base local. Cierra la app y ábrela de nuevo.' : 'Cargando…'}</Text>
        </View>
      )}
    </SafeAreaProvider>
  );
}
