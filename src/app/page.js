'use client';

import { useState, useMemo } from 'react';
import SidePanel from '../components/SidePanel';
import dynamic from 'next/dynamic';
import configuredLayers from '../config/layers';
import { filterFeatures } from '../lib/features';

// Import GeoJSON data directly - no need to serve publicly
import prvPunktData from '../data/prv_punkt.json';
import ultPunktData from '../data/ult_punkt.json';
import utlLedningData from '../data/utl_ledning.json';

const layersById = Object.fromEntries(
  configuredLayers.map((layer) => [layer.id, layer])
);

const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
});

export default function Home() {
  const [selected, setSelected] = useState(null);
  const [activeLayer, setActiveLayer] = useState('prv_punkt');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    vannprøve: false,
    sedimentprøve: false,
    bløtbunnsfauna: false,
    ownerFK: false,
    ownerTK: false,
    ownerTR: false,
  });

  // Load layers directly from imports
  const allLayers = {
    prv_punkt: prvPunktData.features || [],
    ult_punkt: ultPunktData.features || [],
    utl_ledning: utlLedningData.features || [],
  };

  // Get features for the active layer (for sidebar display)
  const activeFeatures = allLayers[activeLayer] || [];

  const filteredPrvPunkt = useMemo(() => {
    return filterFeatures(
      allLayers.prv_punkt,
      layersById.prv_punkt,
      searchQuery,
      filters
    );
  }, [allLayers.prv_punkt, searchQuery, filters]);

  // Filtered layers for the map - only prv_punkt is filtered
  const filteredLayers = {
    prv_punkt: filteredPrvPunkt,
    ult_punkt: allLayers.ult_punkt,
    utl_ledning: allLayers.utl_ledning,
  };

  // Handle layer change - clear search and filters
  const handleLayerChange = (layerId) => {
    setSearchQuery('');
    setFilters({
      vannprøve: false,
      sedimentprøve: false,
      bløtbunnsfauna: false,
      ownerFK: false,
      ownerTK: false,
      ownerTR: false,
    });
    setActiveLayer(layerId);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        <SidePanel
          features={
            activeLayer === 'prv_punkt'
              ? filteredPrvPunkt
              : activeFeatures
          }
          allFeatures={activeFeatures}
          selectedFeature={selected}
          onSelect={setSelected}
          activeLayer={activeLayer}
          onLayerChange={handleLayerChange}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <div className="flex-1">
          <Map
            selectedFeature={selected}
            onSelect={setSelected}
            allLayers={filteredLayers}
            activeLayer={activeLayer}
          />
        </div>
      </div>
    </div>
  );
}
