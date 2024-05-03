import * as L from 'leaflet';

export const drawPluginOptions = {
  position: 'bottomright',
  draw: {
    polygon: {
      allowIntersection: false,
      drawError: {
        color: '#e1e100',
        message: "<strong>Oh snap!<strong> you can't draw that!",
      },
      shapeOptions: {
        color: 'var(--main-color)',
      },
      color: 'var(--main-color)',
    },
    // disable toolbar item by setting it to false
    polyline: false,
    circle: false,
    rectangle: {
      allowIntersection: false,
      drawError: {
        color: '#e1e100',
        message: "<strong>Oh snap!<strong> you can't draw that!",
      },
      shapeOptions: {
        color: 'var(--main-color)',
      },
      color: 'var(--main-color)',
    },
    marker: {
      icon: L.divIcon({
        className: 'marker-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      }),
    },
    circlemarker: false,
  },
  edit: false,
  // edit: {
  //   featureGroup: editableLayers, //REQUIRED!!
  //   remove: false
  // }
};

export const rulersPluginOptions = {
  position: 'bottomleft',
  draw: {
    polygon: {
      allowIntersection: false,
      drawError: {
        color: '#e1e100',
        message: "<strong>Oh snap!<strong> you can't draw that!",
      },
      shapeOptions: {
        color: '#00ADBB',
      },
      color: 'brow',
    },
    // disable toolbar item by setting it to false
    polyline: true,
    circle: false,
    rectangle: false,
    marker: false,
    circlemarker: false,
  },
  edit: false,
  // edit: {
  //   featureGroup: editableLayers, //REQUIRED!!
  //   remove: false
  // }
};
