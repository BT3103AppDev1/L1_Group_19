<script setup>
import { computed, nextTick, ref, watch } from "vue";
import CampusMap from "./components/CampusMap.vue";
import LocationDrawer from "./components/LocationDrawer.vue";
import LocationList from "./components/LocationList.vue";
import LocationSortBar from "./components/LocationSortBar.vue";
import LocationSummary from "./components/LocationSummary.vue";
import NoiseFilterBar from "./components/NoiseFilterBar.vue";
import TypeFilterBar from "./components/TypeFilterBar.vue";
import SubmissionForm from "./components/SubmissionForm.vue";
import SubmissionList from "./components/SubmissionList.vue";
import TopBar from "./components/TopBar.vue";
import AuthPanel from "./components/AuthPanel.vue";
import { useAuth } from "./composables/useAuth";
import { useSubmissions } from "./composables/useSubmissions";
import { locations } from "./data/locations";
import {
  matchesNoiseFilter,
  ratingLabel,
  sortLocationsByNoise,
} from "./utils/locationHelpers";

const selectedLocation = ref(null);
const noiseFilter = ref("all");
const typeFilter = ref("all");
const sortOrder = ref("default");
const showSuccess = ref(false);
const searchQuery = ref("");
const selectedSearchLocation = ref(null);

let successTimeoutId = null;

const {
  submissions,
  isSubmittingSubmission,
  isSubmittingFlag,
  submissionError,
  isLiveConnected,
  lastSyncAt,
  submitSubmission,
  flagSubmission,
  getFlagCount,
  getSubmissionsByLocation,
  getRecentSubmissionsByLocation,
  getAverageRating,
  getLatestComment,
  lastUpdatedText,
  hasUserSubmittedReview,
} = useSubmissions();

const { user, authError, isAuthLoading, login, signup, logout } = useAuth();

async function handleLogin({ email, password }) {
  await login(email, password);
}

async function handleSignup({ email, password }) {
  await signup(email, password);
}

const selectedLocationId = computed(() => selectedLocation.value?.id ?? "");
const hasSubmittedReview = computed(() =>
  user.value?.uid ? hasUserSubmittedReview(user.value.uid) : false
);
const isDataAccessLocked = computed(() => !hasSubmittedReview.value);

const filteredLocations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) return [];

  return locations.filter((location) => {
    return (
      location.name.toLowerCase().includes(query) ||
      location.type.toLowerCase().includes(query)
    );
  });
});

const visibleLocations = computed(() => {
  const filtered = locations.filter((location) => {
    const averageRating = getAverageRating(location.id);
    const matchesNoise = isDataAccessLocked.value
      ? true
      : matchesNoiseFilter(noiseFilter.value, averageRating);
    const matchesType =
      typeFilter.value === "all" || location.type === typeFilter.value;

    return matchesNoise && matchesType;
  });

  const sorted = isDataAccessLocked.value
    ? [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    : sortLocationsByNoise(filtered, getAverageRating, sortOrder.value);

  return sorted.map((location, index) => ({
    ...location,
    rank: index + 1,
    averageRating: getAverageRating(location.id),
    noiseLabel: ratingLabel(getAverageRating(location.id)),
  }));
});

const selectedAverageRating = computed(() =>
  selectedLocation.value ? getAverageRating(selectedLocation.value.id) : null
);

const selectedSubmissionCount = computed(() =>
  selectedLocation.value
    ? getRecentSubmissionsByLocation(selectedLocation.value.id).length
    : 0
);

const selectedLatestComment = computed(() =>
  selectedLocation.value ? getLatestComment(selectedLocation.value.id) : ""
);

const selectedLastUpdated = computed(() =>
  selectedLocation.value
    ? lastUpdatedText(selectedLocation.value.id)
    : "No location selected"
);

const selectedSubmissions = computed(() =>
  selectedLocation.value
    ? getRecentSubmissionsByLocation(selectedLocation.value.id)
    : []
);

const selectedRatingLabel = computed(() =>
  ratingLabel(selectedAverageRating.value)
);

const noiseSubmissions = computed(() =>
  selectedSubmissions.value.filter(
    (submission) =>
      submission.rating !== null &&
      submission.rating !== undefined &&
      submission.comment &&
      submission.comment.trim().length > 0
  ).slice(0, 5)
);

const crowdSubmissions = computed(() =>
  selectedSubmissions.value.filter(
    (submission) => submission.crowdLevel && submission.crowdLevel.length > 0
  )
);
const noiseFlagCounts = computed(() =>
  Object.fromEntries(
    noiseSubmissions.value.map((submission) => [
      submission.submissionId,
      getFlagCount(submission.submissionId),
    ])
  )
);

function clearSuccessMessage() {
  showSuccess.value = false;

  if (successTimeoutId) {
    clearTimeout(successTimeoutId);
    successTimeoutId = null;
  }
}

function handleSelectLocation(location) {
  selectedLocation.value = location;
}

function handleSearchSelect(location) {
  selectedLocation.value = location;
  selectedSearchLocation.value = location;
  searchQuery.value = "";

  nextTick(() => {
    selectedSearchLocation.value = null;
  });
}

async function handleSubmitSubmission({ rating, crowdLevel, comment }) {
  if (!selectedLocation.value || !user.value) return;

  try {
    await submitSubmission({
      locationId: selectedLocation.value.id,
      rating,
      crowdLevel,
      comment,
      user: {
        uid: user.value.uid,
        email: user.value.email,
      },
    });

    clearSuccessMessage();
    showSuccess.value = true;
    successTimeoutId = setTimeout(() => {
      showSuccess.value = false;
      successTimeoutId = null;
    }, 3000);
  } catch (err) {
    clearSuccessMessage();
  }
}

async function handleFlagSubmission({ submissionId, locationId, reason, notes }) {
  try {
    await flagSubmission({
      submissionId,
      locationId,
      reason,
      notes,
    });
  } catch (err) {
    console.error("Failed to submit flag:", err);
  }
}

watch(selectedLocation, () => {
  clearSuccessMessage();
});
</script>

<template>
  <div class="page-shell">
    <TopBar />

    <p class="sync-status">
      {{ isLiveConnected ? "Live updates on" : "Using fallback refresh" }}
      <span v-if="lastSyncAt"
        >• Last synced: {{ new Date(lastSyncAt).toLocaleTimeString() }}</span
      >
    </p>
    <main class="content">
      <div class="workspace">
        <aside class="control-panel">
          <AuthPanel
            :user="user"
            :auth-error="authError"
            :is-loading="isAuthLoading"
            @login="handleLogin"
            @signup="handleSignup"
            @logout="logout"
          />

          <div class="search-panel">
            <input
              v-model.trim="searchQuery"
              type="text"
              class="search-input"
              placeholder="Search for a study location..."
              aria-label="Search for a study location"
            />

            <div
              v-if="searchQuery && filteredLocations.length"
              class="search-results"
            >
              <button
                v-for="location in filteredLocations"
                :key="location.id"
                class="search-result-item"
                @click="handleSearchSelect(location)"
              >
                <strong>{{ location.name }}</strong>
                <span>{{ location.type }}</span>
              </button>
            </div>

            <div
              v-else-if="searchQuery && !filteredLocations.length"
              class="search-results empty"
            >
              <p>No matching locations found.</p>
            </div>
          </div>

          <NoiseFilterBar v-if="!isDataAccessLocked" v-model="noiseFilter" />
          <TypeFilterBar v-model="typeFilter" />
          <LocationSortBar v-if="!isDataAccessLocked" v-model="sortOrder" />

          <LocationList
            :locations="visibleLocations"
            :is-locked="isDataAccessLocked"
            @select-location="handleSelectLocation"
          />
        </aside>

        <section class="map-panel">
          <CampusMap
            :locations="visibleLocations"
            :submissions="submissions"
            :get-average-rating="getAverageRating"
            :get-submissions-by-location="getRecentSubmissionsByLocation"
            :selected-search-location="selectedSearchLocation"
            :is-locked="isDataAccessLocked"
            @select-location="handleSelectLocation"
          />
        </section>
      </div>

      <LocationDrawer
        :selected-location="selectedLocation"
        @close="selectedLocation = null"
      >
        <LocationSummary
          v-if="!isDataAccessLocked"
          :location="selectedLocation"
          :average-rating="selectedAverageRating"
          :rating-label-text="selectedRatingLabel"
          :submission-count="selectedSubmissionCount"
          :last-updated="selectedLastUpdated"
          :latest-comment="selectedLatestComment"
        />
        <div v-else class="auth-required-panel">
          <p v-if="!user">
            Sign in and submit your first review (noise + crowd) to unlock location and noise statistics.
          </p>
          <p v-else>
            Submit your first review (noise + crowd) to unlock location and noise statistics.
          </p>
        </div>

        <SubmissionList
          v-if="!isDataAccessLocked"
          :submissions="noiseSubmissions"
          type="noise"
          :flag-counts="noiseFlagCounts"
          :is-submitting-flag="isSubmittingFlag"
          @flag-submission="handleFlagSubmission"
        />
        <hr class="drawer-divider" />

        <div v-if="!user && !isDataAccessLocked" class="auth-required-panel">
          <p>Please sign in to submit location updates and comments.</p>
        </div>

        <SubmissionForm
          v-else-if="user"
          :location-id="selectedLocationId"
          :is-submitting="isSubmittingSubmission"
          :show-success="showSuccess"
          @submit="handleSubmitSubmission"
        />

        <hr class="drawer-divider" />

        <SubmissionList
          v-if="!isDataAccessLocked"
          :submissions="crowdSubmissions"
          type="crowd"
        />
      </LocationDrawer>
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
  height: 100%;
}

body {
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  background: #f6f7fb;
  color: #122033;
}
</style>

<style scoped>
.page-shell {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  min-height: 0;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(320px, 380px) minmax(0, 1fr);
  gap: 12px;
}

.control-panel {
  min-height: 0;
  overflow-y: auto;
  padding-right: 4px;
}

.map-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
}

.drawer-divider {
  border: 0;
  border-top: 1px solid #eef0f6;
  margin: 16px 0 12px 0;
}

.search-panel {
  position: relative;
  width: 100%;
  margin-bottom: 12px;
  z-index: 1000;
}

.search-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d6dbe7;
  border-radius: 12px;
  background: white;
  font-size: 14px;
  outline: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.search-input:focus {
  border-color: #1f2a44;
}

.search-results {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e7e9f1;
  border-radius: 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
}

.search-result-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  border: 0;
  background: white;
  text-align: left;
  cursor: pointer;
}

.search-result-item:hover {
  background: #f6f7fb;
}

.search-result-item strong {
  font-size: 14px;
  color: #122033;
}

.search-result-item span {
  font-size: 12px;
  color: #5a667a;
}

.search-results.empty {
  padding: 12px 14px;
  font-size: 13px;
  color: #5a667a;
}

.search-results.empty p {
  margin: 0;
}

@media (max-width: 960px) {
  .workspace {
    grid-template-columns: 1fr;
  }

  .control-panel {
    overflow: visible;
    padding-right: 0;
  }

  .map-panel {
    min-height: 50dvh;
  }
}

.auth-required-panel {
  background: #fff7e5;
  border: 1px solid #f5d1a6;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 18px;
  color: #6d4a1e;
  font-size: 0.95rem;
}

.sync-status {
  margin: 8px 12px 0;
  font-size: 13px;
  color: #5a667a;
}

</style>
