// Fecha local "AAAA-MM-DD HH:MM:SS", para agrupar por día con strftime.
export function fechaLocal(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19).replace('T', ' ');
}
