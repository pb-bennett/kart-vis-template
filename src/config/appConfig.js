export const appConfig = {
  title: 'Kart Vis',
  description: 'Kartvisualisering for Færder Kommune',
  language: 'nb-NO',
  locale: 'nb-NO',
  branding: {
    projectName: 'Kart Vis',
    kommune: 'Færder Kommune',
    organizationName: 'Færder Kommune',
    logoSrc: '/FK_logo.svg',
    logoAlt: 'Færder Kommune',
    headerText: null,
  },
  states: {
    loading: 'Laster kartdata...',
    empty: 'Ingen data å vise',
    emptySearch: 'Ingen treff',
    error: 'Kunne ikke laste kartdata',
    malformedData: 'Noen kartobjekter kunne ikke vises',
  },
};

export default appConfig;
