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
const groundStationsDrawer = new AdditionalClasses.GroundStationsDrawer(
  cesiumViewer
);

// tell parent window when ready to receive postMessage calls
$(() =>
  window.parent.postMessage({ ready: true, frame_name: "sat-track" }, "*")
);

window.addEventListener("message", ({ data }) => {
  console.debug("received message in iframe", data);
  const { display: options } = data;
  fetchData(data)
    .then(data => {
      console.debug("graphql data received:", data);
      const { spacecraft1, spacecraft2 } = data.data;
      // center on first spacecraft
      const { center } = draw(spacecraft1, options[0]);
      // optionally draw 2nd
      if (spacecraft2) draw(spacecraft2, options[1]);
      console.debug("spacecraft1 current position", center);
      if (center) {
        const zSign = center.z < 0 ? -1 : 1;
        cesiumViewer.camera.setView({
          destination: CesiumLibrary.Cartesian3.fromElements(
            center.x,
            center.y,
            zSign * 0.18 * 10 ** 8 // good height for LEOs
          )
        });
      }
      cesiumViewer.scene.globe.enableLighting = true;
    })
    .catch(console.error);
});

function buildQuery(spacecraftIds) {
  if (!spacecraftIds || !spacecraftIds.length)
    throw new Error("ERROR: missing spacecraftIds!");
  if (spacecraftIds.length > 1)
    return {
      query: `
        query getSpacecrafts($spacecraftId1: String!, $spacecraftId2: String!) {
          spacecraft1: spacecraft(id: $spacecraftId1) {
            ...comparisonFields
          }
          spacecraft2: spacecraft(id: $spacecraftId2) {
            ...comparisonFields
          }
        }
        fragment comparisonFields on Spacecraft {
          spacecraft_name
          catalogue_number
          international_number
          orbit_category
          latest_tle {
            tle_line1
            tle_line2
            period
          }
        }
      `,
      variables: {
        spacecraftId1: spacecraftIds[0],
        spacecraftId2: spacecraftIds[1]
      }
    };
  else
    return {
      query: `
        query getSpacecraft($spacecraftId1: String!) {
          spacecraft1: spacecraft(id: $spacecraftId1) {
            ...comparisonFields
          }
        }
        fragment comparisonFields on Spacecraft {
          spacecraft_name
          catalogue_number
          international_number
          orbit_category
          latest_tle {
            tle_line1
            tle_line2
            period
          }
        }
      `,
      variables: { spacecraftId1: spacecraftIds[0] }
    };
}

// spacecraftIds: 1 or 2 ids.
function fetchData({
  token: authToken,
  api_endpoint: graphqlEndpoint,
  display
}) {
  const spacecraftIds = display.map(sc => sc.spacecraft_id);
  return fetch(graphqlEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authToken
    },
    body: JSON.stringify(buildQuery(spacecraftIds))
  }).then(r => r.json());
}

function draw(spacecraft, options = {}) {
  let center;
  const tle = spacecraft.latest_tle;
  const lines = [tle.tle_line1, tle.tle_line2];
  const isGeo = /geo/i.test(spacecraft.orbit_category);
  if (!isGeo) {
    if (options.groundtrack && options.groundtrack.on) {
      groundTrackPolylineDrawer.twoLineElement = lines;
      groundTrackPolylineDrawer.draw({ label: spacecraft.spacecraft_name });
    }
  }
  if (options.groundstations && options.groundstations.on) {
    groundStationsDrawer.draw({});
  }
  if (options.groundtrack && options.groundtrack.on) {
    groundTrackPointsDrawer.twoLineElement = lines;
    groundTrackPointsDrawer.showOnlyCurrent = isGeo;
    groundTrackPointsDrawer.draw({ label: spacecraft.spacecraft_name });
  }
  if (options.orbit && options.orbit.on) {
    orbitPolylineDrawer.twoLineElement = lines;
    orbitPolylineDrawer.period = tle.period;
    orbitPolylineDrawer.draw({ label: spacecraft.spacecraft_name, options });
  }
  if (options.current_position && options.current_position.on) {
    currentPositionDrawer.twoLineElement = lines;
    center = currentPositionDrawer.draw({ label: spacecraft.spacecraft_name });
  }
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
