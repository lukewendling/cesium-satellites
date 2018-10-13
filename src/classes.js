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

  draw({ label = "", options = {} }) {
    return this._draw({ label, options });
  }
}

class OrbitPolylineDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._orbitPolyline = null;
    this._period = 0;
  }

  set period(mins) {
    this._period = mins;
  }

  propagate({ satrec, gmst, time }) {
    const positionAndVelocity = satelliteLibrary.propagate(satrec, time);
    const positionEci = positionAndVelocity.position;
    const positionEcf = satelliteLibrary.eciToEcf(positionEci, gmst);
    return [
      positionEcf.x * 1000,
      positionEcf.y * 1000,
      positionEcf.z * 1000
      // 404.8 * 1000
    ];
  }

  // Draw satellite orbit
  _draw({ label, options }) {
    let satelliteOrbit = [];
    // ignores line 1 in 3 line variant.
    let [tle1, tle2] = this.twoLineElement.slice(-2);
    let satrec = satelliteLibrary.twoline2satrec(tle1, tle2);
    let gmst = satelliteLibrary.gstime(new Date());
    // create points to connect with a polyline
    let step = 10; // mins
    let totalSteps = Math.ceil(this._period / step);

    for (let i of [...Array(totalSteps).keys()]) {
      satelliteOrbit.push(
        ...this.propagate({
          satrec,
          gmst,
          time: MomentLibrary()
            .add(i * step, "minutes")
            .toDate()
        })
      );
    }
    // complete the ellipse
    satelliteOrbit.push(
      ...this.propagate({
        satrec,
        gmst,
        time: MomentLibrary()
          .add(Math.floor(this.period), "minutes")
          .toDate()
      })
    );

    // if (this._orbitPolyline)
    //   this._cesiumMapObject.entities.remove(this._orbitPolyline);

    this._orbitPolyline = this._cesiumMapObject.entities.add({
      name: label || "Orbit Path",
      polyline: {
        positions: CesiumLibrary.Cartesian3.unpackArray(satelliteOrbit),
        width: 8,
        followSurface: true,
        material: new CesiumLibrary.PolylineArrowMaterialProperty(
          CesiumLibrary.Color.fromCssColorString(options.orbit.color)
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
  _draw({ label, options }) {
    let [tle1, tle2] = this.twoLineElement.slice(-2);
    let satrec = satelliteLibrary.twoline2satrec(tle1, tle2);
    let newTime = MomentLibrary();
    let positionAndVelocity = satelliteLibrary.propagate(
      satrec,
      newTime.toDate()
    );
    let gmst = satelliteLibrary.gstime(newTime.toDate());
    let positionEci = positionAndVelocity.position;
    let positionEcf = satelliteLibrary.eciToEcf(positionEci, gmst);
    let satellitePos = CesiumLibrary.Cartesian3.fromElements(
      positionEcf.x * 1000,
      positionEcf.y * 1000,
      positionEcf.z * 1000
      // 404.8 * 1000
    );

    // if (this._currentPos)
    //   this._cesiumMapObject.entities.remove(this._currentPos);

    this._currentPos = this._cesiumMapObject.entities.add({
      name: label,
      position: satellitePos,
      billboard: {
        image: "Assets/Icons/sat.png"
      },
      label: {
        text: label.toUpperCase(),
        font: "10pt sans-serif",
        fillColor: CesiumLibrary.Color.WHITE,
        verticalOrigin: CesiumLibrary.VerticalOrigin.TOP,
        pixelOffset: new CesiumLibrary.Cartesian2(0, 32)
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
  _draw({ label, options }) {
    let satelliteOrbit = [];
    let newTime = null;
    let coordinates = null;
    for (let i of [...Array(50).keys()]) {
      newTime = MomentLibrary().add(i * 10, "minutes");
      coordinates = this._tle.getLatLon(this.twoLineElement, newTime.valueOf());
      satelliteOrbit = satelliteOrbit.concat([
        coordinates.lng,
        coordinates.lat,
        0
      ]);
    }
    // if (this._groundTrackPolyline)
    //   this._cesiumMapObject.entities.remove(this._groundTrackPolyline);
    this._groundTrackPolyline = this._cesiumMapObject.entities.add({
      name: label,
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
  _draw({ label, options }) {
    // if (this._orbitPoints.length != 0) {
    //   for (let op of this._orbitPoints)
    //     this._cesiumMapObject.entities.remove(op);
    // }

    let newTime = null;
    let coordinates = null;
    let marker = null;
    let numPoints = this._showOnlyCurrent ? 1 : options.hours || 6;
    for (let i of [...Array(numPoints).keys()]) {
      newTime = MomentLibrary().add(i, "hours");
      coordinates = this._tle.getLatLon(
        this._twoLineElement,
        newTime.valueOf()
      );
      marker = this.getPositionMarker({
        isCurrentPos: i === 0,
        coordinates,
        label: i === 0 ? "now" : `+${i}h`
      });
      this._orbitPoints.push(this._cesiumMapObject.entities.add(marker));
    }
  }
}

class GroundStationsDrawer extends OrbitCommonClass {
  constructor(cesiumMapObject) {
    super(cesiumMapObject);
    this._groundStationPoints = [];
  }

  getGroundStations() {
    return [
      { name: "Hula A", lat: 21.56228, lng: 201.757891389, alt: 428.42 },
      { name: "Hula B", lat: 21.568978333, lng: 201.737703056, alt: 317.7 },
      { name: "Lion A", lat: 51.115097889, lng: 359.093909306, alt: 140.059 },
      { name: "Lion B", lat: 51.117873806, lng: 359.093574806, alt: 138.585 },
      { name: "Boss A", lat: 42.947833333, lng: 288.373441111, alt: 204.62 },
      { name: "Boss B", lat: 42.944754444, lng: 288.369681389, alt: 194.6 },
      { name: "Cook A", lat: 34.822609417, lng: 239.49814825, alt: 271.53 },
      { name: "Cook B", lat: 34.825636194, lng: 239.494601, alt: 267.6 },
      { name: "Guam A", lat: 13.615194444, lng: 144.855794722, alt: 216.9 },
      { name: "Guam B", lat: 13.615880278, lng: 144.855167222, alt: 211.1 },
      { name: "Pike", lat: 38.805935278, lng: 255.47152, alt: 1899.1 },
      { name: "Pogo A", lat: 76.51595995, lng: 291.40002473, alt: 141.76 },
      { name: "Pogo B", lat: 76.51536439, lng: 291.40114169, alt: 147.03 },
      { name: "Pogo C", lat: 76.5157025, lng: 291.395008055, alt: 146.386 },
      { name: "Reef", lat: -7.270022778, lng: 72.370023056, alt: -56.8 }
    ];
  }

  // Draw ground station points with lat-lng coords
  _draw({ label, options }) {
    // if (this._groundStationPoints.length != 0) {
    //   for (let gsp of this._groundStationPoints)
    //     this._cesiumMapObject.entities.remove(gsp);
    // }

    this.getGroundStations().forEach(gs => {
      let marker = {
        name: `Air Force SCN Station ${gs.name}`,
        position: CesiumLibrary.Cartesian3.fromDegrees(gs.lng, gs.lat),
        billboard: {
          image: "Assets/Icons/facility.gif"
        }
      };
      this._groundStationPoints.push(
        this._cesiumMapObject.entities.add(marker)
      );
    });
  }
}

module.exports = {
  GroundTrackPointsDrawer,
  OrbitPolylineDrawer,
  GroundTrackPolylineDrawer,
  CurrentPositionDrawer,
  GroundStationsDrawer
};
