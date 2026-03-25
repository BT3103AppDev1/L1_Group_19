<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
const mapElement = ref(null)
const map = ref(null)
const markersLayer = ref(null)
const selectedLocation = ref(null)
const legendControl = ref(null)

const userRating = ref(null)
const userComment = ref('')
const showSuccess = ref(false)
const submissions = ref([])

const locations = ref([
  { id: 'loc1', name: 'CLB (Central Library)', type: 'Library', lat: 1.29662, lng: 103.77368 },
  { id: 'loc2', name: 'UTown ERC', type: 'Study Room', lat: 1.30449, lng: 103.77206 },
  { id: 'loc3', name: 'UTown Starbucks', type: 'Café', lat: 1.30427, lng: 103.77313 },
  { id: 'loc4', name: 'COM1 Atrium', type: 'Study Area', lat: 1.2959, lng: 103.77355 },
  { id: 'loc5', name: 'COM2 Level 2', type: 'Study Area', lat: 1.29494, lng: 103.77344 },
  { id: 'loc6', name: 'BIZ Library', type: 'Library', lat: 1.2931, lng: 103.7755 },
  { id: 'loc7', name: 'Science Library', type: 'Library', lat: 1.29695, lng: 103.7801 },
  { id: 'loc8', name: 'YIH Study Corners', type: 'Study Area', lat: 1.2982, lng: 103.7746 },
  { id: 'loc9', name: 'Engin Study Zone', type: 'Study Area', lat: 1.2988, lng: 103.7701 },
  { id: 'loc10', name: 'PGP Lounge', type: 'Study Area', lat: 1.2921, lng: 103.7809 },
])

watch(selectedLocation, () => {
  userRating.value = null
  showSuccess.value = false
  userComment.value = ''
})

function initMap() {
  const center = [1.2966, 103.7764]

  if (!mapElement.value) return

  map.value = L.map(mapElement.value, { zoomControl: true }).setView(center, 15)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map.value)

  markersLayer.value = L.layerGroup().addTo(map.value)
}

function getSubmissionsByLocation(locationId) {
  return submissions.value.filter((s) => s.locationId === locationId)
}

function getAverageRating(locationId) {
  const locationSubs = getSubmissionsByLocation(locationId)
  if (!locationSubs.length) return null

  const total = locationSubs.reduce((sum, sub) => sum + sub.rating, 0)
  return total / locationSubs.length
}

function ratingColor(avgRating) {
  if (avgRating === null) return '#95a5a6'
  if (avgRating <= 2) return '#2ecc71'
  if (avgRating <= 3.5) return '#f1c40f'
  if (avgRating <= 4.5) return '#e67e22'
  return '#e74c3c'
}

function ratingLabel(avgRating) {
  if (avgRating === null) return 'No ratings yet'
  if (avgRating <= 2) return 'Quiet'
  if (avgRating <= 3.5) return 'Moderate'
  if (avgRating <= 4.5) return 'Noisy'
  return 'Very loud'
}

function renderMarkers() {
  if (!markersLayer.value || !map.value) return

  markersLayer.value.clearLayers()

  locations.value.forEach((loc) => {
    const avgRating = getAverageRating(loc.id)
    const submissionCount = getSubmissionsByLocation(loc.id).length

    const marker = L.circleMarker([loc.lat, loc.lng], {
      radius: 10,
      weight: 1,
      color: '#1f2a44',
      fillColor: ratingColor(avgRating),
      fillOpacity: 0.9,
    })

    marker.on('click', () => {
      selectedLocation.value = loc
    })

    marker.bindTooltip(
      `<strong>${loc.name}</strong><br>
       Average rating: ${avgRating === null ? 'N/A' : avgRating.toFixed(1)} 
       (${ratingLabel(avgRating)})<br>
       Submissions: ${submissionCount}`,
      { direction: 'top', offset: [0, -8], sticky: true },
    )

    marker.addTo(markersLayer.value)
  })

  const bounds = L.latLngBounds(locations.value.map((l) => [l.lat, l.lng]))
  map.value.fitBounds(bounds, { padding: [30, 30] })
}

function addLegend() {
  if (legendControl.value) legendControl.value.remove()
  if (!map.value) return

  legendControl.value = L.control({ position: 'bottomleft' })

  legendControl.value.onAdd = () => {
    const div = L.DomUtil.create('div', 'legend')
    const stops = [
      { label: 'No ratings yet', color: '#95a5a6' },
      { label: '1.0–2.0 (Quiet)', color: '#2ecc71' },
      { label: '2.1–3.5 (Moderate)', color: '#f1c40f' },
      { label: '3.6–4.5 (Noisy)', color: '#e67e22' },
      { label: '4.6–5.0 (Very loud)', color: '#e74c3c' },
    ]

    div.innerHTML = `
      <div class="legend-title">Average noise rating</div>
      ${stops
        .map(
          (s) => `
            <div class="legend-row">
              <span class="legend-swatch" style="background:${s.color}"></span>
              <span>${s.label}</span>
            </div>`,
        )
        .join('')}
    `
    return div
  }

  legendControl.value.addTo(map.value)
}

function loadSubmissions() {
  try {
    const raw = localStorage.getItem('submissions')
    submissions.value = raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Failed to load submissions from localStorage:', err)
    submissions.value = []
  }
}

function saveSubmissions() {
  try {
    localStorage.setItem('submissions', JSON.stringify(submissions.value))
  } catch (err) {
    console.error('Failed to save submissions to localStorage:', err)
  }
}

function getLatestSubmission(locationId) {
  const locationSubs = submissions.value.filter((s) => s.locationId === locationId)
  if (!locationSubs.length) return null

  return locationSubs.reduce((latest, curr) =>
    curr.createdAt > latest.createdAt ? curr : latest,
  )
}

function getLatestComment(locationId) {
  const latest = getLatestSubmission(locationId)
  return latest ? latest.comment : null
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

function submitRating() {
  if (!userRating.value || !selectedLocation.value) return

  const newSubmission = {
    locationId: selectedLocation.value.id,
    rating: parseInt(userRating.value, 10),
    comment: userComment.value.trim(),
    createdAt: Date.now(),
  }

  submissions.value.push(newSubmission)
  saveSubmissions()
  renderMarkers()

  showSuccess.value = true
  userRating.value = null
  userComment.value = ''

  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

onMounted(() => {
  loadSubmissions()
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
          <button class="drawer-close" @click="selectedLocation = null" aria-label="Close">✕</button>
        </div>

        <div class="drawer-body" v-if="selectedLocation">
          <p class="drawer-row">
            <span class="label">Type:</span> {{ selectedLocation.type }}
          </p>

          <p class="drawer-row">
            <span class="label">Average Rating:</span>
            {{ getAverageRating(selectedLocation.id) === null ? 'N/A' : getAverageRating(selectedLocation.id).toFixed(1) }}
          </p>

          <p class="drawer-row">
            <span class="label">Level:</span>
            {{ ratingLabel(getAverageRating(selectedLocation.id)) }}
          </p>

          <p class="drawer-row">
            <span class="label">Submissions:</span>
            {{ getSubmissionsByLocation(selectedLocation.id).length }}
          </p>

          <p class="drawer-row">
            <span class="label">Last updated:</span>
            {{ lastUpdatedText(selectedLocation.id) }}
          </p>

          <p class="drawer-row">
            <span class="label">Comment:</span>
            {{ getLatestComment(selectedLocation.id) || 'No comment provided.' }}
          </p>

          <div v-if="getSubmissionsByLocation(selectedLocation.id).length">
            <h4>All submissions</h4>
            <ul>
              <li v-for="(submission, index) in getSubmissionsByLocation(selectedLocation.id)" :key="index">
                ⭐ {{ submission.rating }} —
                {{ submission.comment || 'No comment' }}
              </li>
            </ul>
          </div>

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

            <textarea
              v-model="userComment"
              maxlength="140"
              class="comment-input"
              placeholder="Optional comment (max 140 chars)..."
            ></textarea>

            <small>{{ userComment.length }}/140</small>

            <button @click="submitRating" :disabled="!userRating" class="submit-btn">
              Submit Rating
            </button>

            <p v-if="showSuccess" class="success-msg">✅ Rating submitted!</p>
          </div>
        </div>

        <div class="drawer-body" v-else>
          <p class="drawer-hint">Click a marker to see details.</p>
        </div>
      </aside>
    </main>
  </div>
</template>

<style>
* { box-sizing: border-box; }

html,
body,
#app {
  margin: 0;
  min-height: 100%;
}

body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  background: #f6f7fb;
  color: #122033;
}

.page-shell {
  min-height: 100vh;
}

.topbar {
  background: white;
  border-bottom: 1px solid #e7e9f1;
  padding: 18px 18px;
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
  margin: 6px 0 0 0;
  font-size: 14px;
  color: #5a667a;
  max-width: 720px;
}

.content {
  padding: 12px;
}

#map {
  width: 100%;
  height: calc(100vh - 110px);
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #e7e9f1;
  background: #dfe6f3;
}

.drawer {
  position: fixed;
  right: 18px;
  top: 118px;
  width: min(360px, calc(100vw - 36px));
  background: #fff;
  border: 1px solid #e7e9f1;
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.12);
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
  margin: 0 0 4px 0;
  font-size: 14px;
}

.drawer-row .label {
  display: inline-block;
  min-width: 44px;
  color: #5a667a;
  font-weight: 600;
}

.drawer-hint {
  margin: 0;
  color: #5a667a;
  font-size: 14px;
}

.drawer-divider {
  border: 0;
  border-top: 1px solid #eef0f6;
  margin: 16px 0 12px 0;
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
  color: white;
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

.legend {
  background: white;
  border: 1px solid #e7e9f1;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.12);
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
  border: 1px solid rgba(0,0,0,0.15);
}

.comment-input {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
}

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