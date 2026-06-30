'use client';

import { useState } from 'react';
import Image from 'next/image';
import appConfig from '../config/appConfig';
import configuredLayers from '../config/layers';

const sidebarLayers = configuredLayers.filter((layer) => layer.showInSidebar);

function getProperty(feature, field) {
  return feature?.properties?.[field];
}

function hasValue(value) {
  return value !== undefined && value !== null && `${value}`.trim() !== '';
}

function getFirstFieldValue(feature, fields = []) {
  for (const field of fields) {
    const value = getProperty(feature, field);
    if (hasValue(value)) return { field, value };
  }

  return null;
}

function getFeatureIdentity(feature, layer, index) {
  const idFields = [layer?.idField, ...(layer?.fallbackIdFields || [])].filter(
    Boolean
  );

  for (const field of idFields) {
    const value = getProperty(feature, field);
    if (hasValue(value)) return `${field}:${value}`;
  }

  return index === undefined ? null : `index:${index}`;
}

function getSidebarText(feature, layer) {
  const titleFields = layer?.sidebarFields?.title || [layer?.titleField];
  const subtitleFields =
    layer?.sidebarFields?.subtitle || layer?.subtitleFields || [];
  const titleMatch = getFirstFieldValue(feature, titleFields);
  const subtitleMatch = getFirstFieldValue(feature, subtitleFields);

  if (layer?.id === 'utl_ledning') {
    const fcode = getProperty(feature, 'FCODE');
    const lsid = getProperty(feature, 'LSID');
    const length = getProperty(feature, 'LENGTH');

    return {
      title: hasValue(fcode)
        ? `${fcode} - LSID ${hasValue(lsid) ? lsid : '?'}`
        : `LSID ${hasValue(lsid) ? lsid : '?'}`,
      subtitle: hasValue(length) ? `${Number(length).toFixed(0)} m` : '? m',
    };
  }

  if (layer?.id === 'prv_punkt') {
    const psid = getProperty(feature, 'PSID');

    return {
      title: titleMatch?.value || (hasValue(psid) ? `PSID ${psid}` : 'Ukjent'),
      subtitle:
        subtitleMatch?.field === 'PSID'
          ? `PSID: ${subtitleMatch.value}`
          : subtitleMatch?.value?.trim?.() || subtitleMatch?.value || '',
    };
  }

  const psid = getProperty(feature, 'PSID');

  return {
    title: titleMatch?.value || (hasValue(psid) ? `PSID ${psid}` : 'Ukjent'),
    subtitle: hasValue(psid) ? `PSID: ${psid}` : subtitleMatch?.value || '',
  };
}

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

  // Check if any filter is active
  const hasActiveFilters = Object.values(filters).some((v) => v);

  const currentLayer = sidebarLayers.find((l) => l.id === activeLayer);
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
          {sidebarLayers.map((layer) => (
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
              {layer.label}
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
          const key = getFeatureIdentity(f, currentLayer, index);
          const selectedKey = getFeatureIdentity(
            selectedFeature,
            currentLayer
          );
          const { title, subtitle } = getSidebarText(f, currentLayer);

          const isSelected =
            selectedFeature &&
            (selectedKey ? selectedKey === key : selectedFeature === f);

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
