// Frases con las que se entrena la IA del teléfono.
export type Situacion = 'cita' | 'trabajo' | 'familia' | 'fiesta' | 'intenso' | 'escuela' | 'compras' | 'peligro';

export const EJEMPLOS: Record<Situacion, string[]> = {
  cita: [
    'mi cita está muy aburrida', 'la cita no va bien y quiero terminar', 'estoy en una cita a ciegas incómoda', 'no me gusta mi cita de tinder',
    'salí con alguien y no hay química', 'mi ligue solo habla de su ex', 'la cena romántica es un desastre', 'no quiero besar a mi cita',
    'me invitó a cenar y no me cae bien', 'primera cita terrible en el restaurante', 'conocí a alguien de una app y no se parece a sus fotos',
    'mi novio quiere platicar y no tengo ganas', 'el tipo con el que salgo es muy presumido', 'mi crush resultó aburrido',
  ],
  trabajo: [
    'la junta del trabajo es eterna', 'mi jefe no me deja salir de la oficina', 'reunión de trabajo que no termina', 'estoy en una llamada de zoom larguísima',
    'mi jefe quiere que me quede horas extra', 'presentación aburrida con el cliente', 'capacitación de la empresa muy larga', 'comida de la oficina con mis compañeros',
    'mi compañero de oficina no deja de hablar de proyectos', 'junta con recursos humanos', 'no quiero ir al evento de la empresa', 'el gerente está dando un discurso',
    'me llamaron a una junta de última hora', 'entrevista de trabajo que va mal',
  ],
  familia: [
    'comida familiar con mis tíos', 'mi tía pregunta cuándo me caso', 'reunión familiar incómoda', 'mis primos me están molestando', 'mi suegra no para de criticar',
    'estoy en casa de mis suegros', 'bautizo muy largo', 'navidad con la familia y hay pleito', 'mi abuela cuenta lo mismo otra vez', 'mi mamá me quiere presentar a alguien',
    'domingo familiar aburrido', 'mi papá y mi tío están discutiendo de política', 'la cena con mi familia es incómoda', 'cumpleaños de mi sobrino',
  ],
  fiesta: [
    'la fiesta está aburrida', 'ya no quiero estar en el antro', 'mis amigos no se quieren ir del bar', 'la peda se alargó y ya tengo sueño', 'boda muy larga',
    'karaoke y no quiero cantar', 'fiesta donde no conozco a nadie', 'reunión de amigos que no acaba', 'mi amigo está borracho y no me deja ir', 'quieren que tome otra cerveza',
    'concierto malísimo', 'after que no termina', 'posada aburrida', 'estoy en una fiesta y hay mucho ruido',
  ],
  intenso: [
    'mi vecino no deja de hablar', 'me encontré a alguien en la calle y no se calla', 'un conocido me quiere contar su vida', 'alguien no para de platicar conmigo',
    'me topé con mi ex', 'un señor en el camión me hace plática', 'el taxista habla demasiado', 'mi vecina cuenta chismes', 'compañero de asiento muy platicador',
    'una persona intensa me acorraló para platicar', 'me está haciendo plática en el gimnasio', 'conocido que siempre pide favores', 'me quieren pedir dinero prestado',
    'viejo amigo que no suelta la plática',
  ],
  escuela: [
    'la clase es muy aburrida', 'el profe no termina la clase', 'equipo de la escuela que no trabaja', 'exposición en la universidad', 'mi compañero de equipo quiere juntarse a hacer tarea',
    'asesoría con el maestro muy larga', 'conferencia en la uni', 'no quiero quedarme al laboratorio', 'junta de padres de familia en la escuela', 'el maestro me quiere poner a exponer',
    'trabajo en equipo del proyecto escolar', 'ceremonia de graduación eterna', 'me quieren en el comité de alumnos', 'taller obligatorio de la facultad',
  ],
  compras: [
    'un vendedor no me deja en paz', 'me quieren vender un tiempo compartido', 'el vendedor de seguros insiste', 'me ofrecen una tarjeta de crédito en el súper', 'negocio multinivel pirámide',
    'me invitaron a una plática y era para venderme algo', 'el de la agencia de autos no me suelta', 'me están ofreciendo perfumes en la plaza', 'promotor del banco insistente',
    'encuestador en la calle', 'quieren que compre un terreno', 'vendedora de cosméticos muy insistente', 'me quieren inscribir al gimnasio', 'demostración de productos de cocina',
  ],
  peligro: [
    'alguien me está siguiendo', 'un hombre me sigue en la calle', 'tengo miedo', 'me siento en peligro', 'me están amenazando', 'mi pareja se puso violenta', 'me están acosando',
    'un desconocido no me deja bajar del coche', 'el conductor tomó otra ruta y no me responde', 'hay alguien agresivo', 'me quiere golpear', 'me están tocando sin permiso',
    'no me dejan salir y me asusta', 'siento que me van a asaltar',
  ],
};

// Palabras típicas de cada situación. Amplían el vocabulario más allá de las frases.
export const LEXICO: Record<Situacion, string> = {
  cita: 'cita ligue date tinder bumble crush novio novia pretendiente romántica romántico beso besar cena velada química coqueto coqueta enamorado galán salida pareja ex ligar citas cenar',
  trabajo: 'trabajo junta oficina jefe jefa reunión gerente cliente zoom teams meet empresa chamba patrón compañero turno proyecto presentación capacitación recursos humanos entrevista supervisor laboral videollamada horario extra',
  familia: 'familia familiar tío tía tíos tías primo prima suegro suegra suegros cuñado cuñada abuela abuelo mamá papá hermano hermana sobrino sobrina bautizo navidad parientes comida domingo hijo hija soltera caso casar bebé',
  fiesta: 'fiesta antro bar peda boda karaoke after posada concierto cumpleaños baile bailar cerveza tomar borracho borracha amigos música ruido disco xv evento reventón parranda desvelado sueño',
  intenso: 'vecino vecina conocido conocida plática platicar platicador hablar chisme chismes calla callar taxista uber gimnasio favores prestado intenso intensa encontré topé ex señor señora conversación saludar desconocido rollo',
  escuela: 'escuela clase profe profesor profesora maestro maestra universidad uni facultad tarea examen exposición exponer equipo laboratorio salón conferencia taller asesoría alumno alumna graduación prepa secundaria carrera materia escolar',
  compras: 'vendedor vendedora vender venden venta comprar compra seguro seguros tarjeta crédito banco promotor promoción oferta ofrecen tiempo compartido multinivel negocio inversión agencia autos terreno perfume cosméticos encuesta demostración inscribir suscripción telemarketing',
  peligro: 'peligro miedo siguiendo sigue persigue amenaza amenazar violento violenta agresivo agresiva golpe golpear acoso acosando asalto asaltar arma pistola navaja auxilio asusta encerrado secuestro abuso',
};
