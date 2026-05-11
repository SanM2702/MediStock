import type { Categoria } from '../types';

/**
 * Categorías de medicamentos con metadatos visuales
 * Los íconos son emojis representativos (sin dependencia de lucide)
 */
export const categorias: Categoria[] = [
  {
    id: 'analgesico',
    nombre: 'Analgésicos',
    icono: '💊',
    color: '#0F6E56',
    bgColor: '#E6F4F1',
    count: 1,
  },
  {
    id: 'antibiotico',
    nombre: 'Antibióticos',
    icono: '🧬',
    color: '#7C3AED',
    bgColor: '#EDE9FE',
    count: 1,
  },
  {
    id: 'antidiabetico',
    nombre: 'Antidiabéticos',
    icono: '🩸',
    color: '#DC2626',
    bgColor: '#FEF2F2',
    count: 2,
  },
  {
    id: 'antiinflamatorio',
    nombre: 'Antiinflamatorios',
    icono: '🔵',
    color: '#1D4ED8',
    bgColor: '#EFF6FF',
    count: 1,
  },
  {
    id: 'antihipertensivo',
    nombre: 'Antihipertensivos',
    icono: '❤️',
    color: '#E11D48',
    bgColor: '#FFF1F2',
    count: 2,
  },
  {
    id: 'cardioprotector',
    nombre: 'Cardioprotectores',
    icono: '🫀',
    color: '#BE185D',
    bgColor: '#FDF2F8',
    count: 1,
  },
  {
    id: 'gastrointestinal',
    nombre: 'Gastrointestinal',
    icono: '🟢',
    color: '#059669',
    bgColor: '#ECFDF5',
    count: 1,
  },
  {
    id: 'neurologico',
    nombre: 'Neurológico',
    icono: '🧠',
    color: '#9333EA',
    bgColor: '#F5F3FF',
    count: 1,
  },
  {
    id: 'respiratorio',
    nombre: 'Respiratorio',
    icono: '💨',
    color: '#0891B2',
    bgColor: '#ECFEFF',
    count: 1,
  },
];
