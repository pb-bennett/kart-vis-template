export const basemaps = [
  {
    id: 'geonorge',
    label: 'Topografisk Norgeskart farge',
    tileUrl:
      'https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png',
    attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
    maxNativeZoom: 18,
    default: false,
  },
  {
    id: 'geonorgeGraatone',
    label: 'Topografisk Norgeskart gråtone',
    tileUrl:
      'https://cache.kartverket.no/v1/wmts/1.0.0/topograatone/default/webmercator/{z}/{y}/{x}.png',
    attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>',
    maxNativeZoom: 18,
    default: true,
  },
  {
    id: 'osm',
    label: 'OpenStreetMap',
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
    default: false,
  },
];

export const defaultBasemapId =
  basemaps.find((basemap) => basemap.default)?.id || basemaps[0]?.id;

export default basemaps;
