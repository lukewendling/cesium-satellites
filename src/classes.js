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
    return this._draw();
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
    // ignores line 1 in 3 line variant.
    var [tle1, tle2] = this.twoLineElement.slice(-2);
    var satrec = satelliteLibrary.twoline2satrec(tle1, tle2);
    var gmst = satelliteLibrary.gstime(new Date());

    for (var i of [...Array(100).keys()]) {
      newTime = MomentLibrary().add(i * 10, "minutes");
      var positionAndVelocity = satelliteLibrary.propagate(
        satrec,
        newTime.toDate()
      );
      var positionEci = positionAndVelocity.position;
      var positionEcf = satelliteLibrary.eciToEcf(positionEci, gmst),
        satelliteOrbit = satelliteOrbit.concat([
          positionEcf.x * 1000,
          positionEcf.y * 1000,
          positionEcf.z * 1000
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

class CurrentPositionDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._currentPos = null;
  }

  // Draw current position
  _draw() {
    var [tle1, tle2] = this.twoLineElement.slice(-2);
    var satrec = satelliteLibrary.twoline2satrec(tle1, tle2);
    var newTime = MomentLibrary();
    var positionAndVelocity = satelliteLibrary.propagate(
      satrec,
      newTime.toDate()
    );
    var gmst = satelliteLibrary.gstime(newTime.toDate());
    var positionEci = positionAndVelocity.position;
    var positionEcf = satelliteLibrary.eciToEcf(positionEci, gmst);
    var satellitePos = CesiumLibrary.Cartesian3.fromElements(
      positionEcf.x * 1000,
      positionEcf.y * 1000,
      positionEcf.z * 1000
      // 404.8 * 1000
    );

    if (this._currentPos)
      this._cesiumMapObject.entities.remove(this._currentPos);

    this._currentPos = this._cesiumMapObject.entities.add({
      position: satellitePos,
      billboard: {
        image: "Assets/Icons/sat.png"
      }
    });

    return satellitePos;
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

class GroundTrackPointsDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._orbitPoints = [];
    this._showOnlyCurrent = false;
  }

  set showOnlyCurrent(b) {
    this._showOnlyCurrent = b;
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
          fillColor: CesiumLibrary.Color.WHITE,
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
          fillColor: CesiumLibrary.Color.WHITE,
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
    var marker = null;
    var numPoints = this._showOnlyCurrent ? 1 : 6;
    for (var i of [...Array(numPoints).keys()]) {
      newTime = MomentLibrary().add(i, "hours");
      coordinates = this._tle.getLatLon(
        this._twoLineElement,
        newTime.valueOf()
      );
      marker = this.getPositionMarker({
        isCurrentPos: i === 0,
        coordinates,
        label: newTime.fromNow()
      });
      this._orbitPoints.push(this._cesiumMapObject.entities.add(marker));
    }
  }
}

module.exports = {
  GroundTrackPointsDrawer,
  OrbitPolylineDrawer,
  GroundTrackPolylineDrawer,
  CurrentPositionDrawer
};
