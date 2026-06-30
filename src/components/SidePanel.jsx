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

function featureMatchesSearch(feature, layer, query) {
  const trimmedQuery = query?.trim().toLowerCase();
  const searchFields = layer?.searchFields || [];

  if (!trimmedQuery || searchFields.length === 0) return true;

  return searchFields.some((field) => {
    const value = getProperty(feature, field);
    return hasValue(value) && `${value}`.toLowerCase().includes(trimmedQuery);
  });
}

function getConfiguredFilterOptions(layer) {
  return (layer?.filters || []).flatMap((filterGroup) =>
    filterGroup.options || []
  );
}

function featureMatchesFilters(feature, layer, filters) {
  const filterGroups = layer?.filters || [];

  return filterGroups.every((filterGroup) => {
    const selectedOptions = (filterGroup.options || []).filter(
      (option) => filters[option.id]
    );

    if (selectedOptions.length === 0) return true;

    if (filterGroup.type === 'booleanAny') {
      return selectedOptions.some((option) =>
        Boolean(getProperty(feature, option.field))
      );
    }

    if (filterGroup.type === 'equalsAny') {
      return selectedOptions.some((option) => {
        const value = getProperty(feature, filterGroup.field);
        return hasValue(value) && `${value}`.trim() === `${option.value}`;
      });
    }

    return true;
  });
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
  const currentLayer = sidebarLayers.find((l) => l.id === activeLayer);
  const configuredFilterOptions = getConfiguredFilterOptions(currentLayer);
  const hasConfiguredFilters = configuredFilterOptions.length > 0;
  const activeFilterCount = configuredFilterOptions.filter(
    (option) => filters[option.id]
  ).length;
  const hasActiveFilters = activeFilterCount > 0;
  const hasSearchFields = (currentLayer?.searchFields || []).length > 0;
  const displayedFeatures = features
    .filter((feature) =>
      featureMatchesSearch(feature, currentLayer, searchQuery)
    )
    .filter((feature) =>
      featureMatchesFilters(feature, currentLayer, filters)
    );
  const showCount =
    (searchQuery && hasSearchFields) ||
    (hasActiveFilters && hasConfiguredFilters);
  const totalCount = allFeatures?.length || features.length;
  const title =
    currentLayer?.type === 'line'
      ? `Ledninger (${displayedFeatures.length}${
          showCount ? ` av ${totalCount}` : ''
        })`
      : `Punkter (${displayedFeatures.length}${
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
    const clearedFilters = configuredFilterOptions.reduce(
      (nextFilters, option) => ({
        ...nextFilters,
        [option.id]: false,
      }),
      { ...filters }
    );

    onFiltersChange(clearedFilters);
  };

  const getFilterHeading = (filterGroup) =>
    `Filtrer på ${filterGroup.label.toLowerCase()}`;

  const getFilterButtonTitle = () => {
    const firstFilter = currentLayer?.filters?.[0];
    return firstFilter ? `Filter på ${firstFilter.label.toLowerCase()}` : '';
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

      {/* Search box and filter */}
      {(hasSearchFields || hasConfiguredFilters) && (
        <div className="border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="px-3 py-2 flex gap-2">
            {hasSearchFields && (
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
            )}
            {hasConfiguredFilters && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-2 py-2 border rounded-md transition-colors flex items-center justify-center hover:bg-gray-50"
                style={{
                  minWidth: '40px',
                  ...(showFilters || hasActiveFilters
                    ? { borderColor: '#4782cb', color: '#4782cb' }
                    : { borderColor: '#e5e7eb', color: '#656263' }),
                }}
                title={getFilterButtonTitle()}
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
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Filter panel */}
          {showFilters && hasConfiguredFilters && (
            <div
              className="px-3 py-3 border-t"
              style={{
                borderColor: '#e5e7eb',
                backgroundColor: '#f9fafb',
              }}
            >
              {currentLayer.filters.map((filterGroup, groupIndex) => (
                <div
                  key={filterGroup.id}
                  className={groupIndex > 0 ? 'mt-3 pt-3 border-t' : ''}
                  style={
                    groupIndex > 0 ? { borderColor: '#e5e7eb' } : undefined
                  }
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: '#656263' }}
                    >
                      {getFilterHeading(filterGroup)}
                    </span>
                    {groupIndex === 0 && hasActiveFilters && (
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
                    {filterGroup.options.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(filters[option.id])}
                          onChange={() => toggleFilter(option.id)}
                          className="w-3.5 h-3.5 rounded"
                          style={{
                            accentColor: option.color || '#4782cb',
                          }}
                        />
                        <span
                          className="text-xs"
                          style={{ color: '#656263' }}
                        >
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
        {displayedFeatures.map((f, index) => {
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
