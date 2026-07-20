// format.js - Utilidades de formateo para la interfaz de usuario

// Formateador de moneda en USD (Dólar Americano)
export const formatUSD = (value) => {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

// Formateador de fechas
export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return dateString;
  }
};
