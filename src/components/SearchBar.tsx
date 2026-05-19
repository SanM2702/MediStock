import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Buscar medicamento...' }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Search input */}
      <div className="relative flex-1">
        <Search
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          id="search-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-9 pr-4"
          autoComplete="off"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
