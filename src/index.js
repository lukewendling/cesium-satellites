// import crel
// const crel = require("crel");

// import relevant css
const CesiumWidgetsCss = require("cesium/Source/Widgets/widgets.css");
const MiscStyling = require("./main.css");

// import custom classes
const CesiumClasses = require("./cesium-classes.js");
const AdditionalClasses = require("./classes.js");

// define global constants
const cesiumWithCR = new CesiumClasses.CesiumWithCorrectedReflectance(
  "cesiumContainer"
);
const cesiumViewer = cesiumWithCR.cesiumViewer;
const orbitPointsDrawer = new AdditionalClasses.OrbitPointsDrawer(cesiumViewer);
const groundTrackPolylineDrawer = new AdditionalClasses.GroundTrackPolylineDrawer(
  cesiumViewer
);
const orbitPolylineDrawer = new AdditionalClasses.OrbitPolylineDrawer(
  cesiumViewer
);

// tell parent window when ready to receive postMessage calls
$(() =>
  window.parent.postMessage({ ready: true, frame_name: "sat-track" }, "*")
);

window.addEventListener("message", ({ data }) => {
  console.debug("received message in iframe", data);
  fetchData(data)
    .then(({ data }) => {
      console.debug("TLE received:", data);
      draw(data.spacecraft.latest_tle);

      // cesiumViewer.zoomTo(cesiumViewer.entities);
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
      query:
        "query getSpacecraft($spacecraftId: String!) {spacecraft(id: $spacecraftId) {latest_tle}}",
      variables: { spacecraftId }
    })
  }).then(r => r.json());
}

// main entry point of the application
// fetch("stations.txt")
//   .then(res => res.text())
//   .then(function(text) {
//     // this will split the TLE text file line by line
//     twoLineElements = text.match(/[^\r\n]+/g);
//   })
//   .then(() => createListOfSatellites());

/**
 * Draws orbit points and polyline given a TLE string
 * @param {string} _twoLineElement
 */
function draw(_twoLineElement) {
  orbitPointsDrawer.twoLineElement = _twoLineElement;
  orbitPointsDrawer.draw();
  orbitPolylineDrawer.twoLineElement = _twoLineElement;
  orbitPolylineDrawer.draw();
  groundTrackPolylineDrawer.twoLineElement = _twoLineElement;
  groundTrackPolylineDrawer.draw();
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
