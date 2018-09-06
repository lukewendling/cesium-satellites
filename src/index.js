// import crel
const crel = require("crel");

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
const orbitPolylineDrawer = new AdditionalClasses.OrbitPolylineDrawer(
  cesiumViewer
);

// define a global variable to store TLEs
var twoLineElements;

var authToken, graphqlEndpoint, spacecraftId;

// tell parent window when ready to receive postMessage calls
$(() => window.parent.postMessage({ ready: true }, "*"));

window.addEventListener("message", ({ data }) => {
  console.debug("received message in iframe", data);
  const { token, apiEndpoint } = data;
  spacecraftId = data.spacecraftId;
  authToken = token;
  graphqlEndpoint = apiEndpoint;
  fetchData();
});

function fetchData() {
  if (!spacecraftId) return console.warn("ERROR: missing spacecraftId!");
  return fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authToken
    },
    body: JSON.stringify({
      query:
        "query getSpacecraft($spacecraftId: String!) {spacecraft(_id: $spacecraftId) {latest_tle}}",
      variables: { spacecraftId }
    })
  })
    .then(r => r.json())
    .then(({ data }) => {
      console.debug("data fetched:", data);
      drawOrbit(data.spacecraft.latest_tle.join("\n"));
    });
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
function drawOrbit(_twoLineElement) {
  orbitPointsDrawer.twoLineElement = _twoLineElement;
  orbitPolylineDrawer.twoLineElement = _twoLineElement;
}

/**
 * Adds an onClick event to a satellite button
 * @param {Element} _satelliteElement
 */
function addOnClickSatelliteEvent(_satelliteElement) {
  _satelliteElement.onclick = function() {
    var tleIndex = parseInt(this.getAttribute("value"));
    drawOrbit(twoLineElements.slice(tleIndex, tleIndex + 3).join("\n"));
  };
}

/**
 * Creates the list of satellites from the global TLE file
 */
function createListOfSatellites() {
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
}
