<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import L from "leaflet";
import MapLegend from "./MapLegend.vue";
import {
  matchesNoiseFilter,
  ratingColor,
  ratingLabel,
} from "../utils/locationHelpers";

const props = defineProps({
  locations: {
    type: Array,
    required: true,
  },
  submissions: {
    type: Array,
    required: true,
  },
  noiseFilter: {
    type: String,
    required: true,
  },
  typeFilter: {
    type: String,
    required: true,
  },
  getAverageRating: {
    type: Function,
    required: true,
  },
  getSubmissionsByLocation: {
    type: Function,
    required: true,
  },
  selectedSearchLocation: {
  type: Object,
  default: null,
  },
});

const emit = defineEmits(["select-location"]);

const mapElement = ref(null);
const map = ref(null);
const markersLayer = ref(null);

function initMap() {
  const center = [1.2966, 103.7764];

  if (!mapElement.value) return;

  map.value = L.map(mapElement.value, { zoomControl: true }).setView(center, 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map.value);

  markersLayer.value = L.layerGroup().addTo(map.value);
}

function renderMarkers() {
  if (!markersLayer.value || !map.value) return;

  markersLayer.value.clearLayers();

  const visibleLocations = props.locations.filter((location) => {
    const avgRating = props.getAverageRating(location.id);
    const matchesNoise = matchesNoiseFilter(props.noiseFilter, avgRating);
    const matchesType = props.typeFilter === "all" || location.type === props.typeFilter;
    return matchesNoise && matchesType;
  });

  visibleLocations.forEach((location) => {
    const avgRating = props.getAverageRating(location.id);
    const submissionCount = props.getSubmissionsByLocation(location.id).length;

    const marker = L.circleMarker([location.lat, location.lng], {
      radius: 10,
      weight: 1,
      color: "#1f2a44",
      fillColor: ratingColor(avgRating),
      fillOpacity: 0.9,
    });

    marker.on("click", () => {
      emit("select-location", location);
    });

    marker.bindTooltip(
      `<strong>${location.name}</strong><br>
       Average rating: ${avgRating === null ? "N/A" : avgRating.toFixed(1)}
       (${ratingLabel(avgRating)})<br>
       Submissions: ${submissionCount}`,
      { direction: "top", offset: [0, -8], sticky: true }
    );

    marker.addTo(markersLayer.value);
  });

  if (visibleLocations.length) {
    const bounds = L.latLngBounds(visibleLocations.map((location) => [location.lat, location.lng]));
    map.value.fitBounds(bounds, { padding: [30, 30] });
  }
}

watch(
  () => props.noiseFilter,
  () => {
    renderMarkers();
  }
);

watch(
  () => props.typeFilter,
  () => {
    renderMarkers();
  }
);

watch(
  () => props.submissions,
  () => {
    renderMarkers();
  },
  { deep: true }
);

watch(
  () => props.selectedSearchLocation,
  (location) => {
    if (!location || !map.value) return;

    map.value.setView([location.lat, location.lng], 17);
    emit("select-location", location);
  }
);

onMounted(() => {
  initMap();
  renderMarkers();
});

onBeforeUnmount(() => {
  if (map.value) map.value.remove();
});
</script>

<template>
  <div class="map-shell">
    <div ref="mapElement" class="map-canvas" aria-label="Campus map"></div>
    <div class="map-legend-overlay">
      <MapLegend />
    </div>
  </div>
</template>

<style scoped>
.map-shell {
  position: relative;
  flex: 1;
  min-height: 0;
}

.map-canvas {
  width: 100%;
  height: 100%;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e7e9f1;
  background: #dfe6f3;
}

.map-legend-overlay {
  position: absolute;
  left: 16px;
  bottom: 16px;
  z-index: 500;
}

@media (max-width: 640px) {
  .map-canvas {
    min-height: 0;
  }

  .map-legend-overlay {
    left: 12px;
    right: 12px;
    bottom: 12px;
  }
}
</style>
