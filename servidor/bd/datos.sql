-- HoudiniApp: paquetes iniciales de la tienda.
-- Paso 2 de 2. Ejecútalo después de esquema.sql. Repetirlo no duplica nada.

insert into public.marketplace (tipo, nombre, descripcion, contenido) values
  ('voz', 'Emergencia en casa', 'Alguien de la familia necesita que vuelvas ya.',
   '{"nombre": "Emergencia en casa", "rate": 1.1, "pitch": 1.1, "guion": ["Oye, perdón que te moleste.", "Se rompió una tubería y se está inundando la cocina.", "¿Puedes venir? No sé dónde está la llave de paso.", "Gracias, te espero."]}'::jsonb),
  ('voz', 'Compañero de equipo', 'Falla el proyecto minutos antes de entregar.',
   '{"nombre": "Compañero de equipo", "rate": 1.15, "pitch": 1, "guion": ["Hola, tenemos un problema con el proyecto.", "La entrega es hoy y el archivo no abre.", "Necesito que te conectes cuanto antes."]}'::jsonb),
  ('voz', 'Mamá preocupada', 'Clásica, breve y efectiva.',
   '{"nombre": "Mamá preocupada", "rate": 1, "pitch": 1.3, "guion": ["¿Dónde andas, mi amor?", "Ya es tarde y me prometiste ayudarme.", "Vente con cuidado, aquí te espero."]}'::jsonb),
  ('voz', 'Vecino con urgencia', 'Tu mascota se salió a la calle.',
   '{"nombre": "Vecino con urgencia", "rate": 1.05, "pitch": 0.8, "guion": ["Buenas, soy tu vecino.", "Tu perro se salió y anda en la calle.", "Yo lo detengo, pero ven pronto."]}'::jsonb),
  ('voz', 'Paquetería', 'Hay que recibir una entrega en persona.',
   '{"nombre": "Paquetería", "rate": 1, "pitch": 0.9, "guion": ["Buen día, traigo un paquete a su nombre.", "Necesito que alguien lo reciba y firme.", "Lo espero diez minutos."]}'::jsonb),
  ('voz', 'Amigo varado', 'Se le quedó el coche y te pide ayuda.',
   '{"nombre": "Amigo varado", "rate": 1.1, "pitch": 0.9, "guion": ["¡Qué bueno que contestas!", "Se me quedó el coche y no traigo cables.", "¿Me echas la mano? Te mando mi ubicación."]}'::jsonb),
  ('perfil', 'Jefe', 'Llamada de trabajo fuera de horario.',
   '{"nombre": "Jefe", "etiqueta": "Trabajo", "voz": {"nombre": "Jefe", "rate": 1, "pitch": 0.7, "guion": ["Hola, disculpa la hora.", "El cliente adelantó la reunión.", "Necesito que revises el reporte ahora mismo."]}}'::jsonb),
  ('perfil', 'Roomie', 'Se quedó sin llaves afuera.',
   '{"nombre": "Roomie", "etiqueta": "Móvil", "voz": {"nombre": "Roomie", "rate": 1.1, "pitch": 1.1, "guion": ["¡Contesta, por favor!", "Dejé las llaves adentro y estoy afuera.", "¿Cuánto tardas en llegar?"]}}'::jsonb),
  ('perfil', 'Hermana', 'Necesita que pases por ella.',
   '{"nombre": "Hermana", "etiqueta": "Casa", "voz": {"nombre": "Hermana", "rate": 1.05, "pitch": 1.25, "guion": ["Oye, ¿ya vienes?", "Salí temprano y no hay quien me recoja.", "Ándale, te espero en la entrada."]}}'::jsonb)
on conflict (tipo, nombre) where autor_id is null do nothing;
