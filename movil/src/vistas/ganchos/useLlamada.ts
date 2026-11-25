// Lo que pasa durante la llamada: timbre, reloj, voz y pantalla apagada en el oído.
import { useEffect, useRef, useState } from 'react';
import type { DatosLlamada } from '../../dominio/modelos';
import type { Detener } from '../../dominio/puertos';
import { useContenedor } from '../contexto';

const MANOS_LIBRES = 6000;

export function useLlamada(datos: DatosLlamada) {
  const { estiloLlamada, timbre, narrador, oido } = useContenedor();
  const [estilo] = useState(() => estiloLlamada.actual());
  const [inicio, setInicio] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [oculta, setOculta] = useState(false);
  const callar = useRef<Detener | null>(null);
  const enCurso = inicio > 0;

  useEffect(() => {
    timbre.sonar();
    return () => { timbre.parar(); callar.current?.(); callar.current = null; };
  }, []);

  useEffect(() => {
    if (!enCurso) return;
    timbre.parar();
    const hablar = () => { callar.current ??= narrador.narrar(datos); };
    const reloj = setInterval(() => setSegundos(Math.floor((Date.now() - inicio) / 1000)), 1000);
    let vivo = true;
    let dejarDeVigilar: Detener | undefined;
    let respaldo: ReturnType<typeof setTimeout> | undefined;

    // Audio por proximidad: la voz empieza al llevar el teléfono al oído.
    oido.disponible().then((si) => {
      if (!vivo) return;
      if (!si) return hablar();
      dejarDeVigilar = oido.vigilar((enOido) => {
        setOculta(enOido);
        if (enOido) hablar();
      });
      // Si nunca se acerca al oído (manos libres), habla igual.
      respaldo = setTimeout(hablar, MANOS_LIBRES);
    });

    return () => { vivo = false; clearInterval(reloj); clearTimeout(respaldo); dejarDeVigilar?.(); };
  }, [enCurso]);

  return { estilo, enCurso, segundos, oculta, contestar: () => setInicio(Date.now()), mostrar: () => setOculta(false) };
}
