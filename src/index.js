// import crel
// const crel = require("crel");

// import relevant css
const CesiumWidgetsCss = require("cesium/Source/Widgets/widgets.css");
const MiscStyling = require("./main.css");

// import custom classes
const CesiumClasses = require("./cesium-classes.js");
const AdditionalClasses = require("./classes.js");
const CesiumLibrary = require("cesium/Source/Cesium");

// define global constants
const cesium = new CesiumClasses.Cesium("cesiumContainer");
const cesiumViewer = cesium.cesiumViewer;
const groundTrackPointsDrawer = new AdditionalClasses.GroundTrackPointsDrawer(
  cesiumViewer
);
const groundTrackPolylineDrawer = new AdditionalClasses.GroundTrackPolylineDrawer(
  cesiumViewer
);
const orbitPolylineDrawer = new AdditionalClasses.OrbitPolylineDrawer(
  cesiumViewer
);
const currentPositionDrawer = new AdditionalClasses.CurrentPositionDrawer(
  cesiumViewer
);

// tell parent window when ready to receive postMessage calls
$(() =>
  window.parent.postMessage({ ready: true, frame_name: "sat-track" }, "*")
);

window.addEventListener("message", ({ data }) => {
  console.debug("received message in iframe", data);
  fetchData(data)
    .then(data => {
      console.debug("TLE received:", data);
      const { spacecraft } = data.data;
      const { center } = draw(spacecraft);
      console.debug("current position", center);
      const zSign = center.z < 0 ? -1 : 1;
      cesiumViewer.camera.setView({
        destination: CesiumLibrary.Cartesian3.fromElements(
          center.x,
          center.y,
          zSign * 10 ** 7 // good height for LEOs
        )
      });
      cesiumViewer.scene.globe.enableLighting = true;
    })
    .catch(console.error);
});

function fetchData({
  token: authToken,
  apiEndpoint: graphqlEndpoint,
  spacecraftId
}) {
  if (!spacecraftId) throw new Error("ERROR: missing spacecraftId!");
  return fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authToken
    },
    body: JSON.stringify({
      query: `
        query getSpacecraft($spacecraftId: String!) {
          spacecraft(id: $spacecraftId) {
            orbit_category
            latest_tle {
              tle_line1
              tle_line2
            }
          }
        }`,
      variables: { spacecraftId }
    })
  }).then(r => r.json());
}

function draw(spacecraft) {
  const tle = spacecraft.latest_tle;
  const lines = [tle.tle_line1, tle.tle_line2];
  const isGeo = /geo/i.test(spacecraft.orbit_category);
  if (!isGeo) {
    groundTrackPolylineDrawer.twoLineElement = lines;
    groundTrackPolylineDrawer.draw();
  }
  groundTrackPointsDrawer.twoLineElement = lines;
  groundTrackPointsDrawer.showOnlyCurrent = isGeo;
  groundTrackPointsDrawer.draw();
  orbitPolylineDrawer.twoLineElement = lines;
  orbitPolylineDrawer.draw();
  currentPositionDrawer.twoLineElement = lines;
  const center = currentPositionDrawer.draw();
  return { center };
}

/**
 * Adds an onClick event to a satellite button
 * @param {Element} _satelliteElement
 */
// function addOnClickSatelliteEvent(_satelliteElement) {
//   _satelliteElement.onclick = function() {
//     var tleIndex = parseInt(this.getAttribute("value"));
//     drawOrbit(twoLineElements.slice(tleIndex, tleIndex + 3).join("\n"));
//   };
// }

/**
 * Creates the list of satellites from the global TLE file
 */
// function createListOfSatellites() {
//   const listSelector = document.getElementById("list-of-satellites");
//   for (var iterator = 0; iterator < twoLineElements.length; iterator += 3) {
//     // crel here will create an `a` element that represents a satellite button
//     listSelector.appendChild(
//       crel(
//         "a",
//         { class: "list-group-item", value: iterator.toString() },
//         twoLineElements[iterator] // this is the name of the satellite
//       )
//     );
//   }
//   Array.from(listSelector.children).forEach(element =>
//     addOnClickSatelliteEvent(element)
//   );
// }
