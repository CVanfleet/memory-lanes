require([
  "esri/config",
  "esri/Map",
  "esri/views/SceneView",
  "esri/Graphic",
  "esri/layers/GraphicsLayer",
  "esri/rest/locator",
], function (esriConfig, Map, SceneView, Graphic, GraphicsLayer, locator) {
  esriConfig.apiKey = import.meta.env.ARCGIS_KEY;
  const addBtn = document.querySelector("button#add-event-btn");
  const eventForm = document.querySelector("body form");
  const cancelBtn = document.querySelector("body form input#cancel-btn");
  const long = document.querySelector("body form table tr td input#long");
  const lat = document.querySelector("body form table tr td input#lat");
  var choosingNew = false;

  const map = new Map({
    basemap: "hybrid", // Basemap layer service
    ground: "world-elevation",
  });
  const view = new SceneView({
    container: "viewDiv",
    map: map,
    camera: {
      position: {
        x: -111.63361, //Longitude
        y: 39.48343, //Latitude
        z: 4000, //Meters
      },
      tilt: 0,
    },
  });

  const serviceUrl =
    "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";

  addBtn.addEventListener("click", () => {
    if (eventForm.id === "event-form") {
      eventForm.id = "add-event-form";
      choosingNew = true;
    } else {
      eventForm.id = "event-form";
      choosingNew = false;
    }
  });

  cancelBtn.addEventListener("click", () => {
    eventForm.id = "event-form";
    choosingNew = false;
  });

  view.on("click", function (evt) {
    if (choosingNew) {
      const params = {
        location: evt.mapPoint,
      };

      locator.locationToAddress(serviceUrl, params).then(
        function (response) {
          // Show the address found
          const address = response.address;
          showAddress(address, evt.mapPoint);
        },
        function (err) {
          // Show no address found
          showAddress("No address found.", evt.mapPoint);
        }
      );
    }
  });

  function showAddress(address, pt) {
    eventForm.id = "add-event-form";
    long.setAttribute("value", Math.round(pt.longitude * 100000) / 100000);
    lat.setAttribute("value", Math.round(pt.latitude * 100000) / 100000);
  }

  const graphicsLayer = new GraphicsLayer();
  map.add(graphicsLayer);

  let events = null;

  getEvents().then(function (data) {
    events = data;

    events.forEach(function (event) {
      const point = {
        //Create a point
        type: "point",
        longitude: event.long,
        latitude: event.lat,
      };
      const simpleMarkerSymbol = {
        type: "simple-marker",
        color: [80, 119, 200], // Orange
        outline: {
          color: [255, 255, 255], // White
          width: 1,
        },
      };

      const popupTemplate = {
        title: "{Name}",
        content: "{Description}",
      };
      const attributes = {
        Name: event.eventName,
        Description: event.eventDescription,
      };

      const pointGraphic = new Graphic({
        geometry: point,
        symbol: simpleMarkerSymbol,
        attributes: attributes,
        popupTemplate: popupTemplate,
      });

      graphicsLayer.add(pointGraphic);
    });
  });

  // Custom Functions

  eventForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    // Convert the form data to an object
    const formObject = Object.fromEntries(formData.entries());

    console.log(formObject);

    addEvent(formObject);
  });

  function getEvents() {
    return fetch("../data/events.json")
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        return data;
      })
      .catch((error) => console.error(error));
  }

  function addEvent(formObject) {
    getEvents().then(function (data) {
      events = data;

      const newEvent = {
        eventName: formObject.eventName,
        eventDescription: formObject.eventDescription,
        lat: parseFloat(formObject.lat),
        long: parseFloat(formObject.long),
      };

      events.push(newEvent);

      const updatedJson = JSON.stringify(events);
      const fs = require("fs");

      fs.writeFile("../data/events.json", updatedJson, (err) => {
        if (err) {
          console.log("Error writing file", err);
        } else {
          console.log("Successfully wrote file");
        }
      });

      // console.log(updatedJson);

      // fetch('/memory-lanes/data/events.json', {
      //   method: 'POST',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-Type': 'application/json',
      //   },
      //   body: updatedJson,
      // }).then(response => console.log(response.status))
      //   .catch(error => console.error(error));
    });
  }
});
