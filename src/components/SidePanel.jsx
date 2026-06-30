'use client';

import { useState } from 'react';
import Image from 'next/image';
import appConfig from '../config/appConfig';

export default function SidePanel({
  features,
  allFeatures,
  selectedFeature,
  onSelect,
  activeLayer,
  onLayerChange,
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
}) {
  const [showFilters, setShowFilters] = useState(false);

  const layers = [
    { id: 'prv_punkt', name: 'Prøvetakingspunkt', type: 'point' },
    { id: 'ult_punkt', name: 'Overløpspunkt', type: 'point' },
    { id: 'utl_ledning', name: 'Overløpsledning', type: 'line' },
  ];

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some((v) => v);

  const currentLayer = layers.find((l) => l.id === activeLayer);
  const showCount =
    (searchQuery || hasActiveFilters) && activeLayer === 'prv_punkt';
  const totalCount = allFeatures?.length || features.length;
  const title =
    currentLayer?.type === 'line'
      ? `Ledninger (${features.length})`
      : `Punkter (${features.length}${
          showCount ? ` av ${totalCount}` : ''
        })`;

  // Handle layer change - also close filters panel
  const handleLayerChange = (layerId) => {
    setShowFilters(false);
    onLayerChange(layerId);
  };

  // Toggle a filter
  const toggleFilter = (filterName) => {
    onFiltersChange({
      ...filters,
      [filterName]: !filters[filterName],
    });
  };

  // Clear all filters
  const clearFilters = () => {
    onFiltersChange({
      vannprøve: false,
      sedimentprøve: false,
      bløtbunnsfauna: false,
      ownerFK: false,
      ownerTK: false,
      ownerTR: false,
    });
  };

  return (
    <aside
      className="w-80 bg-white border-r h-screen overflow-y-auto flex flex-col"
      style={{ borderColor: '#e5e7eb' }}
    >
      {/* Logo */}
      <div
        className="p-4 border-b"
        style={{ backgroundColor: '#ffffff', borderColor: '#656263' }}
      >
        <Image
          src={appConfig.branding.logoSrc}
          alt={appConfig.branding.logoAlt}
          width={300}
          height={100}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Layer tabs */}
      <div className="border-b" style={{ borderColor: '#e5e7eb' }}>
        <div className="flex">
          {layers.map((layer) => (
            <button
              key={layer.id}
              onClick={() => handleLayerChange(layer.id)}
              className={`flex-1 px-2 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeLayer === layer.id
                  ? 'text-white'
                  : 'border-transparent hover:bg-gray-50'
              }`}
              style={
                activeLayer === layer.id
                  ? {
                      borderColor: '#4782cb',
                      backgroundColor: '#4782cb',
                    }
                  : { color: '#656263' }
              }
            >
              {layer.name}
            </button>
          ))}
        </div>
      </div>

      {/* Search box and filter - only show for prv_punkt */}
      {activeLayer === 'prv_punkt' && (
        <div className="border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="px-3 py-2 flex gap-2">
            <input
              type="text"
              placeholder="Søk i navn eller vannlok..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2"
              style={{
                borderColor: '#e5e7eb',
                color: '#656263',
              }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-2 py-2 border rounded-md transition-colors flex items-center justify-center hover:bg-gray-50"
              style={{
                minWidth: '40px',
                ...(showFilters || hasActiveFilters
                  ? { borderColor: '#4782cb', color: '#4782cb' }
                  : { borderColor: '#e5e7eb', color: '#656263' }),
              }}
              title="Filter på prøvetype"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              {hasActiveFilters && (
                <span className="ml-1 text-xs font-bold flex-shrink-0">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div
              className="px-3 py-3 border-t"
              style={{
                borderColor: '#e5e7eb',
                backgroundColor: '#f9fafb',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-xs font-semibold"
                  style={{ color: '#656263' }}
                >
                  Filtrer på prøvetype
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs hover:underline"
                    style={{ color: '#4782cb' }}
                  >
                    Nullstill
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.vannprøve}
                    onChange={() => toggleFilter('vannprøve')}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: '#4782cb' }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: '#656263' }}
                  >
                    Vannprøve
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.sedimentprøve}
                    onChange={() => toggleFilter('sedimentprøve')}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: '#4782cb' }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: '#656263' }}
                  >
                    Sedimentprøve
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.bløtbunnsfauna}
                    onChange={() => toggleFilter('bløtbunnsfauna')}
                    className="w-3.5 h-3.5 rounded"
                    style={{ accentColor: '#4782cb' }}
                  />
                  <span
                    className="text-xs"
                    style={{ color: '#656263' }}
                  >
                    Bløtbunnsfauna
                  </span>
                </label>
              </div>

              {/* Owner filters */}
              <div
                className="mt-3 pt-3 border-t"
                style={{ borderColor: '#e5e7eb' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-semibold"
                    style={{ color: '#656263' }}
                  >
                    Filtrer på eier
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.ownerFK}
                      onChange={() => toggleFilter('ownerFK')}
                      className="w-3.5 h-3.5 rounded"
                      style={{ accentColor: '#c026d3' }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: '#656263' }}
                    >
                      Færder kommune
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.ownerTK}
                      onChange={() => toggleFilter('ownerTK')}
                      className="w-3.5 h-3.5 rounded"
                      style={{ accentColor: '#22c55e' }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: '#656263' }}
                    >
                      Tønsberg kommune
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.ownerTR}
                      onChange={() => toggleFilter('ownerTR')}
                      className="w-3.5 h-3.5 rounded"
                      style={{ accentColor: '#ff4500' }}
                    />
                    <span
                      className="text-xs"
                      style={{ color: '#656263' }}
                    >
                      Tønsberg renseanlegg
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Header - only show for non-prv_punkt layers */}
      {activeLayer !== 'prv_punkt' && (
        <div
          className="px-4 py-3 border-b"
          style={{
            borderColor: '#e5e7eb',
            backgroundColor: '#f9fafb',
          }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: '#656263' }}
          >
            {title}
          </h2>
        </div>
      )}
      {/* Feature list */}
      <ul className="p-2 flex-1 overflow-y-auto">
        {features.map((f, index) => {
          const key = f.properties.fid ?? `feature-${index}`;
          let title, subtitle;

          if (activeLayer === 'utl_ledning') {
            // Line features
            title = f.properties.FCODE
              ? `${f.properties.FCODE} - LSID ${f.properties.LSID}`
              : `LSID ${f.properties.LSID}`;
            subtitle = `${f.properties.LENGTH?.toFixed(0) || '?'} m`;
          } else if (activeLayer === 'prv_punkt') {
            // Prøvetakingspunkt - use navn
            title = f.properties.navn || `PSID ${f.properties.PSID}`;
            subtitle =
              f.properties['vannlok-kode']?.trim() ||
              (f.properties.PSID ? `PSID: ${f.properties.PSID}` : '');
          } else {
            // Overløpspunkt (ult_punkt)
            title =
              f.properties.navn ||
              f.properties.REF ||
              `PSID ${f.properties.PSID}`;
            subtitle = f.properties.PSID
              ? `PSID: ${f.properties.PSID}`
              : '';
          }

          const isSelected =
            selectedFeature &&
            selectedFeature.properties &&
            selectedFeature.properties.fid === key;

          return (
            <li
              key={key}
              className="cursor-pointer p-2 rounded-md transition-colors"
              style={{
                backgroundColor: isSelected
                  ? '#e8f1fc'
                  : 'transparent',
                borderLeft: isSelected
                  ? '3px solid #4782cb'
                  : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
              }}
              onMouseLeave={(e) => {
                if (!isSelected)
                  e.currentTarget.style.backgroundColor =
                    'transparent';
              }}
              onClick={() => onSelect && onSelect(f)}
              title={title}
            >
              <div
                className="text-sm font-medium"
                style={{ color: '#656263' }}
              >
                {title}
              </div>
              <div className="text-xs" style={{ color: '#9ca3af' }}>
                {subtitle}
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
