const { createApp } = Vue;

createApp({
  data() {
    return {
      map: null,
      markersLayer: null,
      selectedLocation: null,
      legendControl: null,

      // FR5 State variables
      userRating: null,
      showSuccess: false,
      submissions: [],

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
    this.loadSubmissions();

    // attach a noise value to each location (mocked for now)
    this.locations = this.locations.map((l) => ({
      ...l,
      noiseDb: this.mockNoiseDb(l.id),
    }));

    this.initMap();
    this.renderMarkers();
    this.addLegend();
  },

  watch: {
    // Reset rating UI if the user clicks a different map marker
    selectedLocation() {
      this.userRating = null;
      this.showSuccess = false;
    }
  },

  methods: {
    initMap() {
      const center = [1.2966, 103.7764];

      this.map = L.map("map", { zoomControl: true }).setView(center, 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(this.map);

      this.markersLayer = L.layerGroup().addTo(this.map);
    },

    mockNoiseDb(id) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
      const min = 35, max = 85;
      return Math.round(min + (hash % 1000) / 1000 * (max - min));
    },

    noiseColor(db) {
      if (db <= 40) return "#2ecc71";     // green
      if (db <= 55) return "#f1c40f";     // yellow
      if (db <= 70) return "#e67e22";     // orange
      return "#e74c3c";                   // red
    },

    noiseLabel(db) {
      if (db <= 40) return "Quiet";
      if (db <= 55) return "Moderate";
      if (db <= 70) return "Noisy";
      return "Very loud";
    },

    renderMarkers() {
      this.markersLayer.clearLayers();

      this.locations.forEach((loc) => {
        const marker = L.circleMarker([loc.lat, loc.lng], {
          radius: 10,
          weight: 1,
          color: "#1f2a44",
          fillColor: this.noiseColor(loc.noiseDb),
          fillOpacity: 0.9,
        });

        marker.on("click", () => {
          this.selectedLocation = loc;
        });

        marker.bindTooltip(
          `<strong>${loc.name}</strong><br>${loc.noiseDb} dB (${this.noiseLabel(loc.noiseDb)})`,
          { direction: "top", offset: [0, -8], sticky: true }
        );

        marker.addTo(this.markersLayer);
      });

      const bounds = L.latLngBounds(this.locations.map((l) => [l.lat, l.lng]));
      this.map.fitBounds(bounds, { padding: [30, 30] });
    },

    addLegend() {
      if (this.legendControl) this.legendControl.remove();

      this.legendControl = L.control({ position: "bottomleft" });

      this.legendControl.onAdd = () => {
        const div = L.DomUtil.create("div", "legend");
        const stops = [
          { label: "≤ 40 dB (Quiet)", db: 40 },
          { label: "41–55 dB (Moderate)", db: 55 },
          { label: "56–70 dB (Noisy)", db: 70 },
          { label: "≥ 71 dB (Very loud)", db: 999 },
        ];

        div.innerHTML = `
          <div class="legend-title">Noise level</div>
          ${stops
            .map(
              (s) => `
              <div class="legend-row">
                <span class="legend-swatch" style="background:${this.noiseColor(s.db)}"></span>
                <span>${s.label}</span>
              </div>`
            )
            .join("")}
        `;
        return div;
      };

      this.legendControl.addTo(this.map);
    },
    // FR6 logic
    loadSubmissions() {
      try {
        const raw = localStorage.getItem("submissions");
        this.submissions = raw ? JSON.parse(raw) : [];
      } catch (err) {
        console.error("Failed to load submissions from localStorage:", err);
        this.submissions = [];
      }
    },

    saveSubmissions() {
      try {
        localStorage.setItem("submissions", JSON.stringify(this.submissions));
      } catch (err) {
        console.error("Failed to save submissions to localStorage:", err);
      }
    },

    getLatestSubmission(locationId) {
      const locationSubs = this.submissions.filter(s => s.locationId === locationId);
      if (!locationSubs.length) return null;

      return locationSubs.reduce((latest, curr) =>
        curr.createdAt > latest.createdAt ? curr : latest
      );
    },

  formatRelativeTime(timestamp) {
    if (!timestamp) return "No ratings yet";

    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
   const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 10) return "just now";
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr} hr ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;

    return new Date(timestamp).toLocaleString();
  },

  lastUpdatedText(locationId) {
    const latest = this.getLatestSubmission(locationId);
    if (!latest) return "No ratings yet";
    return this.formatRelativeTime(latest.createdAt);
  },

    // FR5 Logic
    submitRating() {
      if (!this.userRating || !this.selectedLocation) return;

      const newSubmission = {
        locationId: this.selectedLocation.id,
        rating: parseInt(this.userRating, 10),
        createdAt: Date.now()
      };

      this.submissions.push(newSubmission);
      this.saveSubmissions();
      
      console.log("Submissions array updated:", this.submissions);

      this.showSuccess = true;
      this.userRating = null; 

      // Hide success message after 3 seconds
      setTimeout(() => {
        this.showSuccess = false;
      }, 3000);
    }
  },
}).mount("#app");