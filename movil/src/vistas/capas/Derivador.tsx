// WebView oculto y sin red que calcula las claves para infraestructura/dispositivo/DerivadorWebView.
import { useRef } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { DerivadorWebView, Pedido } from '../../infraestructura/dispositivo/DerivadorWebView';
import { s } from '../../estilos/derivador';
import { useApp } from '../contexto';

const HTML = `<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'"><script>
async function derivar(contrasena, sal) {
  try {
    const t = new TextEncoder();
    const base = await crypto.subtle.importKey('raw', t.encode(contrasena), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: t.encode(sal), iterations: 600000 }, base, 512);
    ReactNativeWebView.postMessage([...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join(''));
  } catch (e) { ReactNativeWebView.postMessage('error'); }
}</script>`;
const ERROR = 'No se pudo preparar la contraseña.';

function Calculo({ p, derivador }: { p: Pedido; derivador: DerivadorWebView }) {
  const web = useRef<WebView<object>>(null);
  const enviado = useRef(false);
  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={s.oculto}>
      {/* La dirección https solo le da contexto seguro a la página: no se carga nada de internet. */}
      <WebView<object> ref={web} source={{ html: HTML, baseUrl: 'https://houdiniapp.invalid/' }} originWhitelist={['https://houdiniapp.invalid']}
        incognito cacheEnabled={false}
        onLoadEnd={() => {
          if (enviado.current) return;
          enviado.current = true;
          web.current?.injectJavaScript(`derivar(${JSON.stringify(p.contrasena)}, ${JSON.stringify(p.sal)}); true;`);
        }}
        onError={() => { if (derivador.vigente(p)) p.mal(ERROR); }}
        onMessage={({ nativeEvent: { data } }) => {
          if (!derivador.vigente(p)) return;
          if (/^[0-9a-f]{128}$/.test(data)) p.listo(data);
          else p.mal(ERROR);
        }} />
    </View>
  );
}

export function Derivador() {
  const { derivador } = useApp();
  const p = derivador.pendiente;
  return p && <Calculo key={p.id} p={p} derivador={derivador} />;
}
