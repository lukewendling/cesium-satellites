"use strict";

const CesiumLibrary = require("cesium/Source/Cesium");
const MomentLibrary = require("moment");

class CesiumWithCorrectedReflectance {
  constructor(domElement) {
    this.cesiumViewer = new CesiumLibrary.Viewer("cesiumContainer", {
      shadows: true,
      geocoder: false,
      imageryProvider: CesiumLibrary.createOpenStreetMapImageryProvider({
        url: "https://a.tile.openstreetmap.org/"
      }),
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      homeButton: false,
      infoBox: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      navigationHelpButton: false,
      navigationInstructionsInitiallyVisible: false,
      sceneMode: CesiumLibrary.SceneMode.SCENE3D
      //   terrainProvider: CesiumLibrary.createWorldTerrain(),
      //   mapProjection: new CesiumLibrary.WebMercatorProjection()
    });
  }
}

module.exports = exports = {
  CesiumWithCorrectedReflectance: CesiumWithCorrectedReflectance
};
