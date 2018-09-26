"use strict";

const CesiumLibrary = require("cesium/Source/Cesium");
// const MomentLibrary = require("moment");
CesiumLibrary.Ion.defaultAccessToken =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5MDM4YTI5NC0xYTY5LTRjMzktOGVhNS1hYTQxZmZjYmY5YzgiLCJpZCI6MjM1NiwiaWF0IjoxNTM1OTg3NTM3fQ.g0E_3HSxCcUhHRGRrtv5N4fbdI5z3EhcI4rfWmQtgN0";
class CesiumWithCorrectedReflectance {
  constructor(domElement) {
    const imageryProvider = CesiumLibrary.createWorldImagery({
      style: CesiumLibrary.IonWorldImageryStyle.AERIAL_WITH_LABELS
    });
    imageryProvider.defaultBrightness = 1.5;
    this.cesiumViewer = new CesiumLibrary.Viewer("cesiumContainer", {
      shadows: true,
      geocoder: false,
      imageryProvider: imageryProvider,
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: true,
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
