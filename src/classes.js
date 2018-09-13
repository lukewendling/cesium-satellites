"use strict";

const TleJsLibrary = require("tle.js");
const MomentLibrary = require("moment");
const CesiumLibrary = require("cesium/Source/Cesium");
const satelliteLibrary = require("satellite.js");

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
  }

  draw() {
    this._draw();
  }
}

class OrbitPolylineDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._orbitPolyline = null;
  }

  // Draw satellite orbit
  _draw() {
    var satelliteOrbit = [];
    var newTime = null;

    for (var i of [...Array(100).keys()]) {
      newTime = MomentLibrary().add(i * 10, "minutes");
      // ignores line 1 in 3 line variant.
      var [tle1, tle2] = this.twoLineElement.slice(-2);
      var satrec = satelliteLibrary.twoline2satrec(tle1, tle2);
      var positionAndVelocity = satelliteLibrary.propagate(
        satrec,
        newTime.toDate()
      );
      var positionEci = positionAndVelocity.position;
      satelliteOrbit = satelliteOrbit.concat([
        positionEci.x * 1000,
        positionEci.y * 1000,
        positionEci.z * 1000
        // 404.8 * 1000
      ]);
    }
    if (this._orbitPolyline)
      this._cesiumMapObject.entities.remove(this._orbitPolyline);
    this._orbitPolyline = this._cesiumMapObject.entities.add({
      name: "Orbit Polyline",
      polyline: {
        positions: CesiumLibrary.Cartesian3.unpackArray(satelliteOrbit),
        width: 8,
        followSurface: true,
        material: new CesiumLibrary.PolylineArrowMaterialProperty(
          CesiumLibrary.Color.DARKVIOLET
        )
      }
    });
  }
}

class GroundTrackPolylineDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._groundTrackPolyline = null;
  }

  // Draw ground track lines with lat-lng coords
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
        0
      ]);
    }
    if (this._groundTrackPolyline)
      this._cesiumMapObject.entities.remove(this._groundTrackPolyline);
    this._groundTrackPolyline = this._cesiumMapObject.entities.add({
      name: "Ground Track Polyline",
      polyline: {
        positions: CesiumLibrary.Cartesian3.fromDegreesArrayHeights(
          satelliteOrbit
        ),
        width: 3,
        followSurface: true,
        material: new CesiumLibrary.PolylineArrowMaterialProperty(
          CesiumLibrary.Color.DARKGRAY
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

  getPositionMarker({ isCurrentPos = false, coordinates, label }) {
    if (isCurrentPos) {
      // return {
      //   position: CesiumLibrary.Cartesian3.fromDegrees(
      //     coordinates.lat,
      //     coordinates.lng
      //   ),
      //   billboard: {
      //     image: "Assets/Icons/sat.png",
      //     heightReference: CesiumLibrary.HeightReference.CLAMP_TO_GROUND
      //   }
      // };
      return {
        position: CesiumLibrary.Cartesian3.fromDegrees(
          coordinates.lng,
          coordinates.lat
        ),
        point: {
          pixelSize: 15,
          color: CesiumLibrary.Color.ORANGE,
          outlineColor: CesiumLibrary.Color.WHITE,
          outlineWidth: 2
        },
        label: {
          text: label,
          font: "10pt sans-serif",
          // style: CesiumLibrary.LabelStyle.FILL,
          fillColor: CesiumLibrary.Color.BLACK,
          // outlineWidth: 2,
          verticalOrigin: CesiumLibrary.VerticalOrigin.TOP,
          pixelOffset: new CesiumLibrary.Cartesian2(0, 16)
        }
      };
    } else {
      return {
        position: CesiumLibrary.Cartesian3.fromDegrees(
          coordinates.lng,
          coordinates.lat
        ),
        point: {
          pixelSize: 5,
          color: CesiumLibrary.Color.ORANGE,
          outlineColor: CesiumLibrary.Color.BLACK,
          outlineWidth: 2
        },
        label: {
          text: label,
          font: "10pt sans-serif",
          // style: CesiumLibrary.LabelStyle.FILL,
          fillColor: CesiumLibrary.Color.BLACK,
          // outlineWidth: 2,
          verticalOrigin: CesiumLibrary.VerticalOrigin.TOP,
          pixelOffset: new CesiumLibrary.Cartesian2(0, 16)
        }
      };
    }
  }

  // Draw ground track points with lat-lng coords
  _draw() {
    if (this._orbitPoints.length != 0) {
      for (var op of this._orbitPoints)
        this._cesiumMapObject.entities.remove(op);
    }

    var newTime = null;
    var coordinates = null;
    var currentCoordinates = null;
    var marker = null;
    for (var i of [...Array(6).keys()]) {
      newTime = MomentLibrary().add(i, "hours");
      coordinates = this._tle.getLatLon(
        this._twoLineElement,
        newTime.valueOf()
      );
      console.debug(coordinates);
      if (i === 0) currentCoordinates = coordinates;
      marker = this.getPositionMarker({
        isCurrentPos: i === 0,
        coordinates,
        label: newTime.fromNow()
      });
      this._orbitPoints.push(this._cesiumMapObject.entities.add(marker));
    }
    // center on first marker
    this._cesiumMapObject.camera.flyTo({
      destination: CesiumLibrary.Cartesian3.fromDegrees(
        currentCoordinates.lat,
        currentCoordinates.lng,
        15000 * 1000 // initial view at x km
      )
    });
  }
}

module.exports = exports = {
  OrbitPointsDrawer,
  OrbitPolylineDrawer,
  GroundTrackPolylineDrawer
};
