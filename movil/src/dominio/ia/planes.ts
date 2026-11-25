// Planes que propone la IA del teléfono para cada situación.
import type { Accion, PlanEscape } from '../modelos';
import type { Situacion } from './ejemplos';

type Receta = { titulo: string; consejo: string; accion: Accion; quien: [string, string]; tono?: [number, number]; guion: string[]; mensajes: string[] };

const R = (titulo: string, accion: Accion, quien: [string, string], consejo: string, guion: string[], mensajes: string[], tono?: [number, number]): Receta =>
  ({ titulo, accion, quien, consejo, guion, mensajes, tono });

const RECETAS: Record<Situacion | 'general', Receta[]> = {
  cita: [
    R('La roomie sin llaves', 'llamada', ['Sofi Roomie', 'Móvil'], 'Contesta, pon cara de apuro y di: "Me dio gusto, pero mi roomie se quedó afuera". Corto y amable.',
      ['Oye, perdón que te marque.', 'Dejé mis llaves adentro y estoy afuera del depa.', '¿Como en cuánto llegas?', 'No hay nadie más con llave.', 'Mil gracias, aquí te espero.'],
      ['¿Dónde andas?', 'Me quedé afuera sin llaves', 'Ya está oscureciendo', '¿Puedes venir porfa?'], [1.1, 1.2]),
    R('Hermano varado', 'llamada', ['Mi hermano', 'Móvil'], 'Contesta, escucha unos segundos y despídete: "Tengo que ir por mi hermano, ¿lo dejamos para otro día?".',
      ['¿Qué onda, estás ocupado?', 'Se me descompuso el coche y no pasa la grúa.', '¿Puedes venir por mí?', 'Te mando la ubicación.', 'Gracias, te debo una.'],
      ['Oye contesta', 'Se paró el coche', 'La grúa tarda dos horas', '¿Vienes por mí?'], [1, 0.9]),
  ],
  trabajo: [
    R('Entrega en casa', 'llamada', ['Casa', 'Casa'], 'Disculpa breve: "Es de mi casa, tengo que contestar". Sal de la sala y regresa solo por tus cosas.',
      ['Hola, ¿me escuchas?', 'Ya llegó el técnico y pide que esté el titular.', 'Dice que si no, hasta la otra semana.', '¿Alcanzas a venir?', 'Perfecto, le digo que espere.'],
      ['Ya llegó el técnico', 'Pide que firmes tú', 'Solo espera 20 minutos', '¿Vienes?']),
    R('Fuga de agua', 'bomba', ['Vecina 302', 'Móvil'], 'Deja el celular a la vista. Cuando lleguen los mensajes di: "Hay una fuga en mi depa, me conecto más tarde".',
      ['Hola, está saliendo agua de tu puerta.', 'Ya se está mojando el pasillo.', 'El portero no encuentra la llave de paso.', '¿Puedes venir?', 'Sí, acá te esperamos.'],
      ['Está saliendo agua de tu depa', 'Ya llegó al pasillo', 'El portero pregunta si vienes', 'Urge cerrar la llave de paso'], [1.05, 1.2]),
  ],
  familia: [
    R('El jefe de guardia', 'llamada', ['Jefe', 'Trabajo'], 'Nadie discute con un jefe: contesta serio, di "ya voy para allá" y despídete con un abrazo rápido.',
      ['Hola, disculpa que te moleste en tu día.', 'Se cayó el sistema y eres quien lo conoce.', '¿Puedes conectarte o venir?', 'Es cosa de una hora.', 'Te lo agradezco mucho.'],
      ['¿Estás disponible?', 'Se cayó el sistema', 'El cliente está marcando', 'Conéctate en cuanto puedas'], [1, 0.8]),
    R('El perrito de la vecina', 'llamada', ['Vecina Lety', 'Móvil'], 'Cuenta que tu mascota se salió y despídete prometiendo llamar mañana. Nadie se ofende por eso.',
      ['Hola, oye, tu perrito anda en la calle.', 'Se salió cuando abrieron el portón.', 'Lo estoy cuidando pero está muy nervioso.', '¿Vienes por él?', 'Sí, aquí lo tengo.'],
      ['Tu perrito se salió', 'Anda en la calle', 'Ya lo agarré pero llora', '¿Vienes?'], [1.05, 1.25]),
  ],
  fiesta: [
    R('Mañana madrugo', 'bomba', ['Mamá', 'Móvil'], 'Enseña los mensajes y di: "Mañana salgo temprano y me están esperando". Vete sin ronda de despedidas.',
      ['Hola, ¿ya vienes?', 'Acuérdate que salimos a las cinco.', 'Todavía no haces tu maleta.', 'Ya no te tardes, ¿sí?', 'Con cuidado.'],
      ['¿A qué hora llegas?', 'Salimos a las 5 am', 'No has hecho tu maleta', 'Ya cerré con llave, márcame'], [1, 1.15]),
    R('Amigo sin transporte', 'llamada', ['Beto', 'Móvil'], 'Contesta, tápate un oído por el ruido y di que vas por un amigo. Pide tu viaje mientras hablas.',
      ['¿Bueno? ¿Me oyes?', 'Me dejaron plantado y ya no hay camiones.', 'Estoy en la plaza, está cerrando.', '¿Pasas por mí?', 'Va, aquí te espero.'],
      ['¿Andas en la fiesta?', 'Me dejaron plantado', 'Ya van a cerrar la plaza', 'Pasa por mí porfa']),
  ],
  intenso: [
    R('Te están esperando', 'llamada', ['Caro', 'Móvil'], 'Contesta caminando: "Ya voy, estoy a una cuadra". Despídete con la mano y no te detengas.',
      ['¿Ya mero llegas?', 'Ya estamos todos esperándote.', 'Van a cerrar la cocina.', 'Apúrate, ¿sí?', 'Va, te pido lo de siempre.'],
      ['¿Dónde andas?', 'Ya estamos todos', 'Van a cerrar la cocina', 'Apúrateee'], [1.1, 1.2]),
    R('Cita con el doctor', 'bomba', ['Consultorio', 'Trabajo'], 'Mira el celular y di: "Se me hace tarde para mi cita". Es corto y nadie pregunta más.',
      ['Buenas tardes, le llamo del consultorio.', 'Su cita es en quince minutos.', '¿Sí va a poder llegar?', 'El doctor solo espera diez minutos.', 'Perfecto, lo esperamos.'],
      ['Su cita es en 15 minutos', 'Confirme su asistencia', 'El doctor lo espera', 'Tolerancia de 10 minutos'], [1, 1.1]),
  ],
  escuela: [
    R('Mamá en la puerta', 'llamada', ['Mamá', 'Móvil'], 'Levanta la mano, di "es mi mamá, es urgente" y sal. Pide los apuntes después.',
      ['Hola, estoy afuera.', 'Se adelantó la cita y tenemos que irnos.', '¿Puedes salir ya?', 'Pide permiso, yo te espero.', 'Estoy en la puerta principal.'],
      ['Estoy afuera', 'Se adelantó la cita', 'Pide permiso', 'Te espero en la puerta'], [1, 1.15]),
    R('Turno en el trabajo', 'bomba', ['Encargada', 'Trabajo'], 'Enseña los mensajes y di que te cambiaron el turno. Ofrece avanzar tu parte hoy en la noche.',
      ['Hola, faltó una persona al turno.', '¿Puedes llegar antes?', 'Te lo pago doble.', 'Necesito saber ya.', 'Gracias, te espero.'],
      ['¿Puedes venir antes?', 'Faltó alguien', 'Se paga doble', 'Confírmame porfa']),
  ],
  compras: [
    R('La tarjeta bloqueada', 'llamada', ['Casa', 'Casa'], 'Contesta y di: "No puedo decidir nada sin platicarlo en casa". Da las gracias y camina.',
      ['¿Dónde estás?', 'No vayas a comprar nada, ¿eh?', 'Ya gastamos lo de este mes.', 'Mejor vente, ya está la comida.', 'Te espero.'],
      ['No compres nada', 'Ya gastamos lo del mes', 'Vente a comer', 'Ya está servido'], [1.1, 1.15]),
    R('El coche mal estacionado', 'llamada', ['Memo', 'Móvil'], 'Di "se van a llevar mi coche" y sal rápido. Funciona hasta con el vendedor más insistente.',
      ['¡Oye! Se quieren llevar tu coche.', 'Lo dejaste en lugar prohibido.', 'Ya llegó la grúa.', '¡Córrele!', 'Los entretengo un minuto.'],
      ['¡Tu coche!', 'Ya llegó la grúa', 'Córrele', 'Los estoy entreteniendo'], [1.2, 1]),
  ],
  peligro: [
    R('Primero, tu seguridad', 'llamada', ['Papá', 'Móvil'], 'Ve a un lugar con gente y luz, como una tienda. Si el peligro es real llama al 911 y avisa a tus cómplices. La llamada solo sirve para ganar tiempo.',
      ['Ya te vi, estoy a media cuadra.', 'Vengo con tus hermanos.', 'Quédate donde hay gente.', 'No cuelgues, sigue hablando conmigo.', 'Ya casi llegamos.'],
      ['Ya casi llego', 'Te estoy viendo en el mapa', 'Voy con tus hermanos', 'Quédate en la tienda'], [1, 0.8]),
  ],
  general: [
    R('Te necesitan en casa', 'llamada', ['Mamá', 'Móvil'], 'Contesta con calma, di "tengo que irme, me necesitan en casa" y despídete en una sola frase.',
      ['Hola, ¿puedes hablar?', 'Necesito que vengas a la casa.', 'Nada grave, pero es urgente.', '¿Como en cuánto llegas?', 'Gracias, con cuidado.'],
      ['¿Dónde estás?', 'Llámame', 'Necesito que vengas', 'No es grave, pero urge'], [1, 1.2]),
    R('Urgencia del trabajo', 'bomba', ['Jefe', 'Trabajo'], 'Deja ver los mensajes, suspira y di: "Me están buscando del trabajo". Guarda el celular y vete.',
      ['Hola, disculpa la hora.', 'Surgió un problema y te necesitamos.', '¿En cuánto tiempo llegas?', 'Perfecto, aquí te esperamos.'],
      ['¿Estás?', 'Te necesitamos en la oficina', 'Es urgente', 'Contesta por favor'], [1, 0.8]),
  ],
};

// Señales claras de peligro: cuentan aunque el clasificador opine otra cosa.
const ALERTA = new RegExp([
  String.raw`\b(me|nos) (viene[n]? |esta[n]? |anda[n]? )?(sigue[n]?\b(?! (contando|hablando|diciendo|platicando|pidiendo))|sigui(o|endo)|persig|amenaz|acos(o|a|an|ando)\b|golpe|pego|pega[n]?\b|jalone|encerr|secuestr|asalt|rob(o|aron|an)\b)`,
  String.raw`\b(me|nos) (quiere[n]?|va[n]?|trat(a|an|o) de|intent(a|an|o)) (a )?(peg|golp|mat|rob|asalt|viol|secuestr|lastim|tocar|obligar)`,
  String.raw`\b(siguiendome|persiguiendome|acosandome|tocandome|amenazandome)`,
  String.raw`\btoc(a|an|ando) sin`,
  String.raw`\bamenaz|\bacos(ador|ando)|\bsecuestr|\bviolen(t|c)|\barmad[oa]|\bpistola|\bcuchillo|\bnavaja|\bauxilio|\ben peligro|\btengo (mucho )?miedo|\bme da miedo|\babus(ando|ador)|\bdrogaron|no me deja[n]? (bajar|salir de(l| la| su| mi)? (coche|carro|auto|cuarto|casa))`,
].join('|'));
export const haySenalDePeligro = (texto: string) =>
  ALERTA.test(texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));

// Cambia de idea si el título ya se propuso.
export function planPara(situacion: Situacion | 'general', evitar = '', azar = Math.random()): PlanEscape {
  const lista = RECETAS[situacion];
  const nuevas = lista.filter((r) => r.titulo !== evitar);
  const opciones = nuevas.length ? nuevas : lista;
  const r = opciones[Math.floor(azar * opciones.length)];
  const [nombre, etiqueta] = r.quien;
  const [rate, pitch] = r.tono ?? [1, 1];
  return {
    titulo: r.titulo, consejo: r.consejo, accion: r.accion, riesgo: situacion === 'peligro',
    llamada: { nombre, etiqueta, voz: { nombre: r.titulo, rate, pitch, guion: r.guion } },
    mensajes: r.mensajes.map((texto) => ({ de: nombre, texto })),
  };
}
