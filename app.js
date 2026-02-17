const { createApp } = Vue;

createApp({
  data() {
    return {
      map: null,
      markersLayer: null,

      // sample locations on campus
      locations: [
        { id: "loc1", name: "CLB (Central Library)", type: "Library", lat: 1.29662, lng: 103.77368 },
        { id: "loc2", name: "UTown ERC", type: "Study Room", lat: 1.30449, lng: 103.77206 },
        { id: "loc3", name: "UTown Starbucks", type: "Café", lat: 1.30427, lng: 103.77313 },
        { id: "loc4", name: "COM1 Atrium", type: "Study Area", lat: 1.29590, lng: 103.77355 },
        { id: "loc5", name: "COM2 Level 2", type: "Study Area", lat: 1.29494, lng: 103.77344 },
        { id: "loc6", name: "BIZ Library", type: "Library", lat: 1.29310, lng: 103.77550 },
        { id: "loc7", name: "Science Library", type: "Library", lat: 1.29695, lng: 103.78010 },
        { id: "loc8", name: "YIH Study Corners", type: "Study Area", lat: 1.29820, lng: 103.77460 },
        { id: "loc9", name: "Engin Study Zone", type: "Study Area", lat: 1.29880, lng: 103.77010 },
        { id: "loc10", name: "PGP Lounge", type: "Study Area", lat: 1.29210, lng: 103.78090 },
      ],
    };
  },

  mounted() {
    this.initMap();
    this.renderMarkers();
  },

  methods: {
    initMap() {
      // Center near Kent Ridge
      const center = [1.2966, 103.7764];

      this.map = L.map("map", {
        zoomControl: true,
      }).setView(center, 15);

      // OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);

      this.markersLayer = L.layerGroup().addTo(this.map);
    },

    renderMarkers() {
      this.markersLayer.clearLayers();

      this.locations.forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lng]);

        // popup with location name and type
        marker.bindPopup(`<strong>${loc.name}</strong><br>${loc.type}`);

        marker.addTo(this.markersLayer);
      });

      const bounds = L.latLngBounds(this.locations.map((l) => [l.lat, l.lng]));
      this.map.fitBounds(bounds, { padding: [30, 30] });
    },
  },
}).mount("#app");
