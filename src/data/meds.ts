import type { MedicamentoConFarmacias } from '../types';

/**
 * Datos mock de 11 medicamentos colombianos reales
 * cubiertos por EPS en Sabana Centro, Cundinamarca
 */
export const medicamentos: MedicamentoConFarmacias[] = [
  // ── 1. Acetaminofén ──────────────────────────────────────────────────────
  {
    id: 'acetaminofen-500',
    nombre: 'Acetaminofén 500 mg',
    generico: 'Paracetamol',
    precio: 1800,
    categoria: 'Analgésico',
    laboratorio: 'Tecnoquímicas',
    icono: '💊',
    epsCobertura: ['Nueva EPS', 'Sura', 'Sanitas', 'Compensar'],
    descripcion: 'Analgésico y antipirético de primera línea.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 320, estado: 'disponible', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-2', nombre: 'Farmacia Comunal Cajicá', municipio: 'Cajicá', distancia: '3.1 km', stock: 85, estado: 'disponible', telefono: '601 860 0450', horario: 'Lun–Sáb 8am–8pm' },
      { farmaciaId: 'farm-3', nombre: 'Drogas El Rosal', municipio: 'Zipaquirá', distancia: '14.7 km', stock: 12, estado: 'disponible', telefono: '601 851 2100', horario: 'Lun–Dom 8am–9pm' },
    ],
  },

  // ── 2. Amoxicilina ───────────────────────────────────────────────────────
  {
    id: 'amoxicilina-500',
    nombre: 'Amoxicilina 500 mg',
    generico: 'Amoxicillin',
    precio: 4200,
    categoria: 'Antibiótico',
    laboratorio: 'Genfar',
    icono: '🧬',
    epsCobertura: ['Nueva EPS', 'Sura', 'Sanitas'],
    descripcion: 'Antibiótico de amplio espectro para infecciones bacterianas.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 48, estado: 'disponible', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-4', nombre: 'Farmacia Salud Total', municipio: 'Cajicá', distancia: '3.8 km', stock: 5, estado: 'limitado', telefono: '601 860 1800', horario: 'Lun–Vie 7am–7pm' },
    ],
  },

  // ── 3. Metformina ────────────────────────────────────────────────────────
  {
    id: 'metformina-850',
    nombre: 'Metformina 850 mg',
    generico: 'Metformin HCl',
    precio: 2600,
    categoria: 'Antidiabético',
    laboratorio: 'Procaps',
    icono: '🩸',
    epsCobertura: ['Nueva EPS', 'Compensar', 'Sura'],
    descripcion: 'Hipoglucemiante oral para diabetes tipo 2.',
    farmacias: [
      { farmaciaId: 'farm-2', nombre: 'Farmacia Comunal Cajicá', municipio: 'Cajicá', distancia: '3.1 km', stock: 200, estado: 'disponible', telefono: '601 860 0450', horario: 'Lun–Sáb 8am–8pm' },
      { farmaciaId: 'farm-3', nombre: 'Drogas El Rosal', municipio: 'Zipaquirá', distancia: '14.7 km', stock: 0, estado: 'agotado', telefono: '601 851 2100', horario: 'Lun–Dom 8am–9pm' },
      { farmaciaId: 'farm-5', nombre: 'Droguería Central Sopó', municipio: 'Sopó', distancia: '9.3 km', stock: 67, estado: 'disponible', telefono: '601 862 0033', horario: 'Lun–Dom 7am–9pm' },
    ],
  },

  // ── 4. Ibuprofeno ────────────────────────────────────────────────────────
  {
    id: 'ibuprofeno-400',
    nombre: 'Ibuprofeno 400 mg',
    generico: 'Ibuprofen',
    precio: 1500,
    categoria: 'Antiinflamatorio',
    laboratorio: 'Lafrancol',
    icono: '🔵',
    epsCobertura: ['Sanitas', 'Sura', 'Nueva EPS', 'Compensar'],
    descripcion: 'Antiinflamatorio no esteroideo (AINE) para dolor e inflamación.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 0, estado: 'agotado', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-3', nombre: 'Drogas El Rosal', municipio: 'Zipaquirá', distancia: '14.7 km', stock: 140, estado: 'disponible', telefono: '601 851 2100', horario: 'Lun–Dom 8am–9pm' },
      { farmaciaId: 'farm-5', nombre: 'Droguería Central Sopó', municipio: 'Sopó', distancia: '9.3 km', stock: 8, estado: 'disponible', telefono: '601 862 0033', horario: 'Lun–Dom 7am–9pm' },
    ],
  },

  // ── 5. Losartán ──────────────────────────────────────────────────────────
  {
    id: 'losartan-50',
    nombre: 'Losartán 50 mg',
    generico: 'Losartan Potasio',
    precio: 3100,
    categoria: 'Antihipertensivo',
    laboratorio: 'Mk (Tecnoquímicas)',
    icono: '❤️',
    epsCobertura: ['Nueva EPS', 'Sura', 'Compensar'],
    descripcion: 'Antihipertensivo antagonista del receptor de angiotensina II.',
    farmacias: [
      { farmaciaId: 'farm-4', nombre: 'Farmacia Salud Total', municipio: 'Cajicá', distancia: '3.8 km', stock: 110, estado: 'disponible', telefono: '601 860 1800', horario: 'Lun–Vie 7am–7pm' },
      { farmaciaId: 'farm-3', nombre: 'Drogas El Rosal', municipio: 'Zipaquirá', distancia: '14.7 km', stock: 34, estado: 'disponible', telefono: '601 851 2100', horario: 'Lun–Dom 8am–9pm' },
    ],
  },

  // ── 6. Atorvastatina ─────────────────────────────────────────────────────
  {
    id: 'atorvastatina-20',
    nombre: 'Atorvastatina 20 mg',
    generico: 'Atorvastatin Calcium',
    precio: 5800,
    categoria: 'Cardioprotector',
    laboratorio: 'Pfizer Colombia',
    icono: '🫀',
    epsCobertura: ['Sura', 'Sanitas'],
    descripcion: 'Estatina para reducir el colesterol y riesgo cardiovascular.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 22, estado: 'disponible', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-2', nombre: 'Farmacia Comunal Cajicá', municipio: 'Cajicá', distancia: '3.1 km', stock: 3, estado: 'limitado', telefono: '601 860 0450', horario: 'Lun–Sáb 8am–8pm' },
      { farmaciaId: 'farm-5', nombre: 'Droguería Central Sopó', municipio: 'Sopó', distancia: '9.3 km', stock: 0, estado: 'agotado', telefono: '601 862 0033', horario: 'Lun–Dom 7am–9pm' },
    ],
  },

  // ── 7. Enalapril ─────────────────────────────────────────────────────────
  {
    id: 'enalapril-10',
    nombre: 'Enalapril 10 mg',
    generico: 'Enalapril Maleato',
    precio: 2200,
    categoria: 'Antihipertensivo',
    laboratorio: 'Genfar',
    icono: '💙',
    epsCobertura: ['Nueva EPS', 'Sura', 'Compensar', 'Sanitas'],
    descripcion: 'Inhibidor de la ECA para hipertensión e insuficiencia cardíaca.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 75, estado: 'disponible', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-6', nombre: 'Farmacia El Carmen', municipio: 'Tabio', distancia: '18.2 km', stock: 9, estado: 'disponible', telefono: '601 858 0012', horario: 'Lun–Sáb 8am–6pm' },
    ],
  },

  // ── 8. Omeprazol ─────────────────────────────────────────────────────────
  {
    id: 'omeprazol-20',
    nombre: 'Omeprazol 20 mg',
    generico: 'Omeprazole',
    precio: 3400,
    categoria: 'Gastrointestinal',
    laboratorio: 'Tecnoquímicas',
    icono: '🟢',
    epsCobertura: ['Sura', 'Sanitas', 'Nueva EPS', 'Compensar'],
    descripcion: 'Inhibidor de la bomba de protones para úlceras y reflujo.',
    farmacias: [
      { farmaciaId: 'farm-2', nombre: 'Farmacia Comunal Cajicá', municipio: 'Cajicá', distancia: '3.1 km', stock: 155, estado: 'disponible', telefono: '601 860 0450', horario: 'Lun–Sáb 8am–8pm' },
      { farmaciaId: 'farm-7', nombre: 'Drogas Bienestar Tenjo', municipio: 'Tenjo', distancia: '22.0 km', stock: 40, estado: 'disponible', telefono: '601 859 0210', horario: 'Lun–Vie 8am–7pm' },
    ],
  },

  // ── 9. Clonazepam ────────────────────────────────────────────────────────
  {
    id: 'clonazepam-05',
    nombre: 'Clonazepam 0.5 mg',
    generico: 'Clonazepam',
    precio: 6100,
    categoria: 'Neurológico',
    laboratorio: 'Roche Colombia',
    icono: '🧠',
    epsCobertura: ['Sura', 'Sanitas'],
    descripcion: 'Benzodiacepina para ansiedad y epilepsia. Requiere fórmula médica.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 6, estado: 'disponible', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-3', nombre: 'Drogas El Rosal', municipio: 'Zipaquirá', distancia: '14.7 km', stock: 0, estado: 'agotado', telefono: '601 851 2100', horario: 'Lun–Dom 8am–9pm' },
    ],
  },

  // ── 10. Salbutamol ───────────────────────────────────────────────────────
  {
    id: 'salbutamol-inh',
    nombre: 'Salbutamol Inhalador 100 mcg',
    generico: 'Albuterol',
    precio: 18500,
    categoria: 'Respiratorio',
    laboratorio: 'GlaxoSmithKline',
    icono: '💨',
    epsCobertura: ['Nueva EPS', 'Sura', 'Sanitas', 'Compensar'],
    descripcion: 'Broncodilatador de acción rápida para asma y EPOC.',
    farmacias: [
      { farmaciaId: 'farm-4', nombre: 'Farmacia Salud Total', municipio: 'Cajicá', distancia: '3.8 km', stock: 14, estado: 'disponible', telefono: '601 860 1800', horario: 'Lun–Vie 7am–7pm' },
      { farmaciaId: 'farm-5', nombre: 'Droguería Central Sopó', municipio: 'Sopó', distancia: '9.3 km', stock: 3, estado: 'limitado', telefono: '601 862 0033', horario: 'Lun–Dom 7am–9pm' },
    ],
  },

  // ── 11. Insulina NPH ─────────────────────────────────────────────────────
  {
    id: 'insulina-nph',
    nombre: 'Insulina NPH 100 UI/mL',
    generico: 'Insulina Isófana',
    precio: 42000,
    categoria: 'Antidiabético',
    laboratorio: 'Novo Nordisk',
    icono: '💉',
    epsCobertura: ['Nueva EPS', 'Sura', 'Compensar'],
    descripcion: 'Insulina de acción intermedia para diabetes tipo 1 y 2.',
    farmacias: [
      { farmaciaId: 'farm-1', nombre: 'Droguería La Esperanza', municipio: 'Chía', distancia: '0.4 km', stock: 28, estado: 'disponible', telefono: '601 863 1200', horario: 'Lun–Dom 7am–10pm' },
      { farmaciaId: 'farm-8', nombre: 'Farmacia San Francisco', municipio: 'Cogua', distancia: '19.5 km', stock: 4, estado: 'limitado', telefono: '601 857 0088', horario: 'Lun–Sáb 8am–7pm' },
    ],
  },
];

/** Lista de categorías únicas para los chips de filtro */
export const categorias = [
  'Analgésico',
  'Antibiótico',
  'Antidiabético',
  'Antiinflamatorio',
  'Antihipertensivo',
  'Cardioprotector',
  'Gastrointestinal',
  'Neurológico',
  'Respiratorio',
] as const;
