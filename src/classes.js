"use strict";

const TleJsLibrary = require("tle.js");
const MomentLibrary = require("moment");
const CesiumLibrary = require("cesium/Source/Cesium");

class OrbitCommonClass {
  constructor(cesiumMapObject) {
    this._cesiumMapObject = cesiumMapObject;
    this._tle = new TleJsLibrary();
    this._twoLineElement = null;
  }

  get twoLineElement() {
    return this._twoLineElement;
  }

  set twoLineElement(twoLineElementString) {
    this._twoLineElement = twoLineElementString;
    this._draw();
  }
}

class OrbitPolylineDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._orbitPolyline = null;
  }

  _draw() {
    var satelliteOrbit = [];
    var newTime = null;
    var coordinates = null;
    for (var i of [...Array(50).keys()]) {
      newTime = MomentLibrary().add(i * 10, "minutes");
      coordinates = this._tle.getLatLon(this.twoLineElement, newTime.valueOf());
      satelliteOrbit = satelliteOrbit.concat([
        coordinates.lng,
        coordinates.lat,
        404.8 * 1000
      ]);
    }
    if (this._orbitPolyline)
      this._cesiumMapObject.entities.remove(this._orbitPolyline);
    this._orbitPolyline = this._cesiumMapObject.entities.add({
      name: "Orbit Polyline",
      polyline: {
        positions: CesiumLibrary.Cartesian3.fromDegreesArrayHeights(
          satelliteOrbit
        ),
        width: 3,
        followSurface: true,
        material: new CesiumLibrary.PolylineArrowMaterialProperty(
          CesiumLibrary.Color.PURPLE
        )
      }
    });
  }
}

class OrbitPointsDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._orbitPoints = [];
  }

  _draw() {
    if (this._orbitPoints.length != 0) {
      for (var op of this._orbitPoints)
        this._cesiumMapObject.entities.remove(op);
    }

    var newTime = null;
    var coordinates = null;
    for (var i of [...Array(8).keys()]) {
      newTime = MomentLibrary().add(i, "hours");
      coordinates = this._tle.getLatLon(
        this._twoLineElement,
        newTime.valueOf()
      );
      this._orbitPoints.push(
        this._cesiumMapObject.entities.add({
          position: CesiumLibrary.Cartesian3.fromDegrees(
            coordinates.lng,
            coordinates.lat,
            404.8 * 1000
          ),
          point: {
            pixelSize: 5,
            color: CesiumLibrary.Color.ORANGE,
            outlineColor: CesiumLibrary.Color.WHITE,
            outlineWidth: 2
          },
          label: {
            text: newTime.fromNow(),
            font: "10pt sans-serif",
            // style: CesiumLibrary.LabelStyle.FILL,
            fillColor: CesiumLibrary.Color.BLACK,
            // outlineWidth: 2,
            verticalOrigin: CesiumLibrary.VerticalOrigin.TOP,
            pixelOffset: new CesiumLibrary.Cartesian2(0, 16)
          }
        })
      );
    }
  }
}

module.exports = exports = {
  OrbitPointsDrawer: OrbitPointsDrawer,
  OrbitPolylineDrawer: OrbitPolylineDrawer
};
