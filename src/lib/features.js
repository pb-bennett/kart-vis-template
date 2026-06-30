function hasValue(value) {
  return value !== undefined && value !== null && `${value}`.trim() !== '';
}

export function getFeatureProperty(feature, field) {
  return feature?.properties?.[field];
}

export function getFeatureIdentity(feature, layerConfig, fallback) {
  const idFields = [
    layerConfig?.idField,
    ...(layerConfig?.fallbackIdFields || []),
  ].filter(Boolean);

  for (const field of idFields) {
    const value = getFeatureProperty(feature, field);
    if (hasValue(value)) return `${field}:${value}`;
  }

  return fallback ?? null;
}

export function getFirstNonEmptyProperty(feature, fields = []) {
  for (const field of fields) {
    const value = getFeatureProperty(feature, field);
    if (hasValue(value)) return { field, value };
  }

  return null;
}

export function featureMatchesSearch(feature, layerConfig, searchQuery) {
  const query = searchQuery?.trim().toLowerCase();
  const searchFields = layerConfig?.searchFields || [];

  if (!query || searchFields.length === 0) return true;

  return searchFields.some((field) => {
    const value = getFeatureProperty(feature, field);
    return hasValue(value) && `${value}`.toLowerCase().includes(query);
  });
}

export function featureMatchesFilters(feature, layerConfig, filters = {}) {
  const filterGroups = layerConfig?.filters || [];

  return filterGroups.every((filterGroup) => {
    const selectedOptions = (filterGroup.options || []).filter(
      (option) => filters[option.id]
    );

    if (selectedOptions.length === 0) return true;

    if (filterGroup.type === 'booleanAny') {
      return selectedOptions.some((option) =>
        Boolean(getFeatureProperty(feature, option.field))
      );
    }

    if (filterGroup.type === 'equalsAny') {
      return selectedOptions.some((option) => {
        const value = getFeatureProperty(feature, filterGroup.field);
        return hasValue(value) && `${value}`.trim() === `${option.value}`;
      });
    }

    return true;
  });
}

export function filterFeatures(
  features = [],
  layerConfig,
  searchQuery = '',
  filters = {}
) {
  return features
    .filter((feature) =>
      featureMatchesSearch(feature, layerConfig, searchQuery)
    )
    .filter((feature) =>
      featureMatchesFilters(feature, layerConfig, filters)
    );
}

export function getConfiguredFilterOptions(layerConfig) {
  return (layerConfig?.filters || []).flatMap(
    (filterGroup) => filterGroup.options || []
  );
}

