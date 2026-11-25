// Mide la IA del teléfono dejando una frase fuera cada vez: npm run ia
import { ClasificadorBayes } from '../src/dominio/ia/ClasificadorBayes.ts';
import { EJEMPLOS, LEXICO } from '../src/dominio/ia/ejemplos.ts';
import { haySenalDePeligro } from '../src/dominio/ia/planes.ts';

const datos = Object.entries(EJEMPLOS).flatMap(([clase, frases]) => frases.map((f) => [f, clase]));
const conLexico = (c) => Object.entries(LEXICO).forEach(([k, f]) => c.aprender(f, k));
let bien = 0;
for (const [i, [frase, clase]] of datos.entries()) {
  const c = new ClasificadorBayes();
  datos.forEach(([f, k], j) => { if (j !== i) c.aprender(f, k); });
  conLexico(c);
  if (c.clasificar(frase)[0]?.clase === clase) bien++;
}
console.log(`Validación cruzada: ${bien} de ${datos.length} (${Math.round((bien / datos.length) * 100)}%). Al azar sería ${Math.round(100 / Object.keys(EJEMPLOS).length)}%.`);

// Frases nuevas, escritas aparte del entrenamiento.
const NUEVAS = [
  ['la cita de hoy es un fracaso total', 'cita'], ['mi date no para de presumir su carro', 'cita'], ['llevo tres horas en una junta', 'trabajo'],
  ['mi jefa quiere hablar conmigo otra vez', 'trabajo'], ['mis tías preguntan por qué sigo soltera', 'familia'], ['cena en casa de mi suegra', 'familia'],
  ['estoy en el antro y ya me quiero ir a dormir', 'fiesta'], ['boda de un amigo aburridísima', 'fiesta'], ['el vecino me agarró de plática', 'intenso'],
  ['me topé a mi ex en el súper', 'intenso'], ['el maestro alargó la clase', 'escuela'], ['proyecto en equipo de la uni', 'escuela'],
  ['me quieren vender un seguro', 'compras'], ['vendedor de tiempo compartido', 'compras'], ['mi cuñado otra vez con sus negocios', 'familia'], ['la maestra quiere que pase al pizarrón', 'escuela'], ['me está contando sus problemas la vecina', 'intenso'],
  ['mis cuates quieren seguirla', 'fiesta'], ['salí con un chavo y qué flojera', 'cita'], ['me marcan del call center de una tarjeta', 'compras'],
  ['el supervisor quiere revisar pendientes', 'trabajo'], ['hay un borracho que me quiere pegar', 'peligro'],
  ['un tipo me viene siguiendo', 'peligro'], ['me amenazaron en la calle', 'peligro'],
];
const c = new ClasificadorBayes();
datos.forEach(([f, k]) => c.aprender(f, k));
conLexico(c);
const malas = NUEVAS.filter(([f, k]) => c.clasificar(f)[0]?.clase !== k);
console.log(`Frases nuevas: ${NUEVAS.length - malas.length} de ${NUEVAS.length}.`);
malas.forEach(([f, k]) => console.log(`  "${f}" es ${k}, dijo ${c.clasificar(f)[0]?.clase}`));

// Las señales de peligro no pueden fallar ni saltar por cualquier cosa.
const PELIGRO = ['un tipo me viene siguiendo', 'hay un borracho que me quiere pegar', 'mi novio me pegó', 'me están amenazando', 'trae una pistola', 'tengo miedo',
  'no me dejan salir de la casa', 'el taxista no me deja bajar', 'me siento en peligro', 'me van a asaltar', 'me está acosando un compañero', 'me siguen dos hombres', 'me tocan sin permiso'];
const CALMA = ['mi tía me sigue contando chismes', 'la junta sigue y sigue', 'mi jefe me quiere hablar', 'el vendedor me sigue hablando', 'quiero seguir a mi amigo', 'me da pena irme',
  'una fiesta de violines', 'la película de miedo está aburrida', 'mi ex me pidió perdón', 'me regaló una navidad fea', 'el maestro no nos deja salir de clase'];
const fallas = [...PELIGRO.filter((f) => !haySenalDePeligro(f)), ...CALMA.filter(haySenalDePeligro)];
console.log(fallas.length ? `Peligro, FALLAN: ${fallas.join(' | ')}` : `Señales de peligro: ${PELIGRO.length + CALMA.length} de ${PELIGRO.length + CALMA.length}.`);
if (fallas.length) process.exit(1);
