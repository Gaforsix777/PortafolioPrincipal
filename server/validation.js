export function validateContact(input) {
  const values = {};
  const errors = {};
  for (const field of ['name', 'email', 'message']) values[field] = typeof input?.[field] === 'string' ? input[field].trim() : '';
  if (values.name.length < 2 || values.name.length > 100) errors.name = 'Escribe un nombre de 2 a 100 caracteres.';
  if (values.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Escribe un correo válido.';
  if (values.message.length < 10 || values.message.length > 2000) errors.message = 'Escribe un mensaje de 10 a 2000 caracteres.';
  return { values, errors, valid: Object.keys(errors).length === 0 };
}
