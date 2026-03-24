<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

const mapElement = ref(null)
const map = ref(null)
const markersLayer = ref(null)
const legendControl = ref(null)
const selectedLocation = ref(null)

// FR5 State variables
const userRating = ref(null)
const showSuccess = ref(false)
const submissions = ref([])

// sample locations on campus
const locations = ref([
  { id: 'loc1', name: 'CLB (Central Library)', type: 'Library', lat: 1.29662, lng: 103.77368, noiseDb: 0 },
  { id: 'loc2', name: 'UTown ERC', type: 'Study Room', lat: 1.30449, lng: 103.77206, noiseDb: 0 },
  { id: 'loc3', name: 'UTown Starbucks', type: 'Cafe', lat: 1.30427, lng: 103.77313, noiseDb: 0 },
  { id: 'loc4', name: 'COM1 Atrium', type: 'Study Area', lat: 1.2959, lng: 103.77355, noiseDb: 0 },
  { id: 'loc5', name: 'COM2 Level 2', type: 'Study Area', lat: 1.29494, lng: 103.77344, noiseDb: 0 },
  { id: 'loc6', name: 'BIZ Library', type: 'Library', lat: 1.2931, lng: 103.7755, noiseDb: 0 },
  { id: 'loc7', name: 'Science Library', type: 'Library', lat: 1.29695, lng: 103.7801, noiseDb: 0 },
  { id: 'loc8', name: 'YIH Study Corners', type: 'Study Area', lat: 1.2982, lng: 103.7746, noiseDb: 0 },
  { id: 'loc9', name: 'Engin Study Zone', type: 'Study Area', lat: 1.2988, lng: 103.7701, noiseDb: 0 },
  { id: 'loc10', name: 'PGP Lounge', type: 'Study Area', lat: 1.2921, lng: 103.7809, noiseDb: 0 },
])

// Reset rating UI if the user clicks a different map marker
watch(selectedLocation, () => {
  userRating.value = null
  showSuccess.value = false
})

function initMap() {
  const L = window.L
  const center = [1.2966, 103.7764]

  if (!mapElement.value || !L) return

  map.value = L.map(mapElement.value, { zoomControl: true }).setView(center, 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  markersLayer.value = L.layerGroup().addTo(map.value)
}

function mockNoiseDb(id) {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const min = 35
  const max = 85
  return Math.round(min + ((hash % 1000) / 1000) * (max - min))
}

function noiseColor(db) {
  if (db <= 40) return '#2ecc71' // green
  if (db <= 55) return '#f1c40f' // yellow
  if (db <= 70) return '#e67e22' // orange
  return '#e74c3c' // red
}

function noiseLabel(db) {
  if (db <= 40) return 'Quiet'
  if (db <= 55) return 'Moderate'
  if (db <= 70) return 'Noisy'
  return 'Very loud'
}

function renderMarkers() {
  const L = window.L

  if (!markersLayer.value || !map.value || !L) return

  markersLayer.value.clearLayers()

  locations.value.forEach((loc) => {
    const marker = L.circleMarker([loc.lat, loc.lng], {
      radius: 10,
      weight: 1,
      color: '#1f2a44',
      fillColor: noiseColor(loc.noiseDb),
      fillOpacity: 0.9,
    })

    marker.on('click', () => {
      selectedLocation.value = loc
    })

    marker.bindTooltip(
      `<strong>${loc.name}</strong><br>${loc.noiseDb} dB (${noiseLabel(loc.noiseDb)})`,
      { direction: 'top', offset: [0, -8], sticky: true },
    )

    marker.addTo(markersLayer.value)
  })

  const bounds = L.latLngBounds(locations.value.map((loc) => [loc.lat, loc.lng]))
  map.value.fitBounds(bounds, { padding: [30, 30] })
}

function addLegend() {
  const L = window.L

  if (!map.value || !L) return
  if (legendControl.value) legendControl.value.remove()

  legendControl.value = L.control({ position: 'bottomleft' })

  legendControl.value.onAdd = () => {
    const div = L.DomUtil.create('div', 'legend')
    const stops = [
      { label: '≤ 40 dB (Quiet)', db: 40 },
      { label: '41–55 dB (Moderate)', db: 55 },
      { label: '56–70 dB (Noisy)', db: 70 },
      { label: '≥ 71 dB (Very loud)', db: 999 },
    ]

    div.innerHTML = `
      <div class="legend-title">Noise level</div>
      ${stops
        .map(
          (stop) => `
          <div class="legend-row">
            <span class="legend-swatch" style="background:${noiseColor(stop.db)}"></span>
            <span>${stop.label}</span>
          </div>`,
        )
        .join('')}
    `
    return div
  }

  legendControl.value.addTo(map.value)
}

// FR6 logic
function loadSubmissions() {
  try {
    const raw = localStorage.getItem('submissions')
    submissions.value = raw ? JSON.parse(raw) : []
  } catch (error) {
    console.error('Failed to load submissions from localStorage:', error)
    submissions.value = []
  }
}

function saveSubmissions() {
  try {
    localStorage.setItem('submissions', JSON.stringify(submissions.value))
  } catch (error) {
    console.error('Failed to save submissions to localStorage:', error)
  }
}

function getLatestSubmission(locationId) {
  const locationSubs = submissions.value.filter((submission) => submission.locationId === locationId)
  if (!locationSubs.length) return null

  return locationSubs.reduce((latest, current) =>
    current.createdAt > latest.createdAt ? current : latest,
  )
}

function formatRelativeTime(timestamp) {
  if (!timestamp) return 'No ratings yet'

  const diffMs = Date.now() - timestamp
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHr < 24) return `${diffHr} hr ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`

  return new Date(timestamp).toLocaleString()
}

function lastUpdatedText(locationId) {
  const latest = getLatestSubmission(locationId)
  if (!latest) return 'No ratings yet'
  return formatRelativeTime(latest.createdAt)
}

// FR5 Logic
function submitRating() {
  if (!userRating.value || !selectedLocation.value) return

  const newSubmission = {
    locationId: selectedLocation.value.id,
    rating: Number.parseInt(userRating.value, 10),
    createdAt: Date.now(),
  }

  submissions.value.push(newSubmission)
  saveSubmissions()

  showSuccess.value = true
  userRating.value = null

  // Hide success message after 3 seconds
  window.setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

onMounted(() => {
  loadSubmissions()

  // attach a noise value to each location (mocked for now)
  locations.value = locations.value.map((location) => ({
    ...location,
    noiseDb: mockNoiseDb(location.id),
  }))

  initMap()
  renderMarkers()
  addLegend()
})

onBeforeUnmount(() => {
  if (legendControl.value) legendControl.value.remove()
  if (map.value) map.value.remove()
})
</script>

<template>
  <div class="page-shell">
    <header class="topbar">
      <h1>Campus Noise Map</h1>
      <p class="subtitle">Interactive map with ≥10 study locations</p>
    </header>

    <main class="content">
      <div ref="mapElement" id="map" aria-label="Campus map"></div>

      <aside class="drawer" :class="{ open: !!selectedLocation }" aria-label="Location details">
        <div class="drawer-header">
          <h2 class="drawer-title">
            {{ selectedLocation ? selectedLocation.name : 'Location details' }}
          </h2>
          <button class="drawer-close" @click="selectedLocation = null" aria-label="Close">
            ✕
          </button>
        </div>

        <div v-if="selectedLocation" class="drawer-body">
          <p class="drawer-row"><span class="label">Type:</span> {{ selectedLocation.type }}</p>
          <p class="drawer-row"><span class="label">Noise:</span> {{ selectedLocation.noiseDb }} dB</p>
          <p class="drawer-row">
            <span class="label">Level:</span> {{ noiseLabel(selectedLocation.noiseDb) }}
          </p>
          <p class="drawer-row">
            <span class="label">Last updated:</span> {{ lastUpdatedText(selectedLocation.id) }}
          </p>

          <hr class="drawer-divider" />
          <div class="rating-section">
            <h3 class="rating-title">Rate Current Noise</h3>
            <select v-model="userRating" class="rating-select">
              <option :value="null" disabled>Select level...</option>
              <option value="1">1 - Very Quiet</option>
              <option value="2">2 - Quiet</option>
              <option value="3">3 - Moderate</option>
              <option value="4">4 - Noisy</option>
              <option value="5">5 - Very Loud</option>
            </select>

            <button :disabled="!userRating" class="submit-btn" @click="submitRating">
              Submit Rating
            </button>
            <p v-if="showSuccess" class="success-msg">✅ Rating submitted!</p>
          </div>
        </div>

        <div v-else class="drawer-body">
          <p class="drawer-hint">Click a marker to see details.</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f6f7fb;
  color: #122033;
}

.page-shell {
  min-height: 100vh;
}

/* ===== Header ===== */
.topbar {
  background: #fff;
  border-bottom: 1px solid #e7e9f1;
  padding: 18px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.topbar h1 {
  font-size: 22px;
  margin: 0;
  font-weight: 650;
  letter-spacing: 0.2px;
}

.subtitle {
  margin: 6px 0 0;
  font-size: 14px;
  color: #5a667a;
  max-width: 720px;
}

/* ===== Main Layout ===== */
.content {
  padding: 12px;
}

/* ===== Map Card ===== */
#map {
  width: 100%;
  height: calc(100vh - 110px);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e7e9f1;
  background: #dfe6f3;
}

/* ===== Drawer (FR2) ===== */
.drawer {
  position: fixed;
  right: 18px;
  top: 118px;
  width: min(360px, calc(100vw - 36px));
  background: #fff;
  border: 1px solid #e7e9f1;
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transform: translateY(12px);
  opacity: 0;
  pointer-events: none;
  transition: 180ms ease;
  z-index: 9999;
}

.drawer.open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #eef0f6;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.drawer-close {
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.drawer-body {
  padding: 12px 14px;
}

.drawer-row {
  margin: 0 0 4px;
  font-size: 14px;
}

.drawer-row .label {
  display: inline-block;
  min-width: 88px;
  color: #5a667a;
  font-weight: 600;
}

.drawer-hint {
  margin: 0;
  color: #5a667a;
  font-size: 14px;
}

/* ===== Rating UI (FR5) ===== */
.drawer-divider {
  border: 0;
  border-top: 1px solid #eef0f6;
  margin: 16px 0 12px;
}

.rating-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rating-title {
  font-size: 14px;
  margin: 0;
  font-weight: 650;
  color: #122033;
}

.rating-select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background-color: #fff;
}

.submit-btn {
  padding: 10px;
  background-color: #1f2a44;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:disabled {
  background-color: #a0a6b5;
  cursor: not-allowed;
}

.submit-btn:not(:disabled):hover {
  background-color: #111827;
}

.success-msg {
  color: #10b981;
  font-size: 13px;
  margin: 0;
  font-weight: 600;
  text-align: center;
}

/* ===== Legend ===== */
.legend {
  background: #fff;
  border: 1px solid #e7e9f1;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #122033;
}

.legend-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

/* Mobile: bottom sheet */
@media (max-width: 640px) {
  #map {
    height: calc(100vh - 120px);
  }

  .drawer {
    left: 14px;
    right: 14px;
    top: auto;
    bottom: 14px;
    width: auto;
  }
}
</style>
