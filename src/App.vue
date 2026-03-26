<script setup>
import { computed, ref, watch } from "vue";
import CampusMap from "./components/CampusMap.vue";
import LocationDrawer from "./components/LocationDrawer.vue";
import LocationSummary from "./components/LocationSummary.vue";
import NoiseFilterBar from "./components/NoiseFilterBar.vue";
import TypeFilterBar from "./components/TypeFilterBar.vue";
import RatingForm from "./components/RatingForm.vue";
import SubmissionList from "./components/SubmissionList.vue";
import TopBar from "./components/TopBar.vue";
import { useSubmissions } from "./composables/useSubmissions";
import { locations } from "./data/locations";
import { ratingLabel } from "./utils/locationHelpers";

const selectedLocation = ref(null);
const noiseFilter = ref("all");
const typeFilter = ref("all");
const showSuccess = ref(false);
let successTimeoutId = null;

const {
  submissions,
  isSubmitting,
  submitRating,
  getSubmissionsByLocation,
  getAverageRating,
  getLatestComment,
  lastUpdatedText,
} = useSubmissions();

const selectedLocationId = computed(() => selectedLocation.value?.id ?? "");
const selectedAverageRating = computed(() =>
  selectedLocation.value ? getAverageRating(selectedLocation.value.id) : null
);
const selectedSubmissionCount = computed(() =>
  selectedLocation.value ? getSubmissionsByLocation(selectedLocation.value.id).length : 0
);
const selectedLatestComment = computed(() =>
  selectedLocation.value ? getLatestComment(selectedLocation.value.id) : ""
);
const selectedLastUpdated = computed(() =>
  selectedLocation.value ? lastUpdatedText(selectedLocation.value.id) : "No ratings yet"
);
const selectedSubmissions = computed(() =>
  selectedLocation.value ? getSubmissionsByLocation(selectedLocation.value.id) : []
);
const selectedRatingLabel = computed(() => ratingLabel(selectedAverageRating.value));

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

async function handleSubmitRating({ rating, comment }) {
  if (!selectedLocation.value) return;

  try {
    await submitRating({
      locationId: selectedLocation.value.id,
      rating,
      comment,
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

watch(selectedLocation, () => {
  clearSuccessMessage();
});
</script>

<template>
  <div class="page-shell">
    <TopBar />

    <main class="content">
      <NoiseFilterBar v-model="noiseFilter" />
      <TypeFilterBar v-model="typeFilter" />

      <CampusMap
        :locations="locations"
        :submissions="submissions"
        :noise-filter="noiseFilter"
        :type-filter="typeFilter"
        :get-average-rating="getAverageRating"
        :get-submissions-by-location="getSubmissionsByLocation"
        @select-location="handleSelectLocation"
      />

      <LocationDrawer :selected-location="selectedLocation" @close="selectedLocation = null">
        <LocationSummary
          :location="selectedLocation"
          :average-rating="selectedAverageRating"
          :rating-label-text="selectedRatingLabel"
          :submission-count="selectedSubmissionCount"
          :last-updated="selectedLastUpdated"
          :latest-comment="selectedLatestComment"
        />

        <SubmissionList :submissions="selectedSubmissions" />

        <hr class="drawer-divider" />

        <RatingForm
          :location-id="selectedLocationId"
          :is-submitting="isSubmitting"
          :show-success="showSuccess"
          @submit="handleSubmitRating"
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

.drawer-divider {
  border: 0;
  border-top: 1px solid #eef0f6;
  margin: 16px 0 12px 0;
}
</style>
