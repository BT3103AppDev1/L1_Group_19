<script setup>
import { computed, ref, watch } from "vue";
import CampusMap from "./components/CampusMap.vue";
import CrowdUpdateForm from "./components/CrowdUpdateForm.vue";
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
const showCrowdSuccess = ref(false);

let successTimeoutId = null;
let crowdSuccessTimeoutId = null;

const {
  submissions,
  isSubmittingNoise,
  isSubmittingCrowd,
  submitRating,
  submitCrowdUpdate,
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

const noiseSubmissions = computed(() =>
  selectedSubmissions.value.filter(
    (submission) =>
      submission.rating !== null &&
      submission.rating !== undefined
  )
);

const crowdSubmissions = computed(() =>
  selectedSubmissions.value.filter(
    (submission) =>
      submission.crowdLevel &&
      submission.crowdLevel.length > 0
  )
);

function clearSuccessMessage() {
  showSuccess.value = false;

  if (successTimeoutId) {
    clearTimeout(successTimeoutId);
    successTimeoutId = null;
  }
}

function clearCrowdSuccessMessage() {
  showCrowdSuccess.value = false;

  if (crowdSuccessTimeoutId) {
    clearTimeout(crowdSuccessTimeoutId);
    crowdSuccessTimeoutId = null;
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

async function handleSubmitCrowdUpdate({ crowdLevel }) {
  if (!selectedLocation.value) return;

  try {
    await submitCrowdUpdate({
      locationId: selectedLocation.value.id,
      crowdLevel,
    });

    clearCrowdSuccessMessage();
    showCrowdSuccess.value = true;
    crowdSuccessTimeoutId = setTimeout(() => {
      showCrowdSuccess.value = false;
      crowdSuccessTimeoutId = null;
    }, 3000);
  } catch (err) {
    clearCrowdSuccessMessage();
  }
}

watch(selectedLocation, () => {
  clearSuccessMessage();
  clearCrowdSuccessMessage();
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

        <SubmissionList :submissions="noiseSubmissions" type="noise"/>

        <hr class="drawer-divider" />

        <RatingForm
          :location-id="selectedLocationId"
          :is-submitting="isSubmittingNoise"
          :show-success="showSuccess"
          @submit="handleSubmitRating"
        />

        <hr class="drawer-divider" />

        <SubmissionList :submissions="crowdSubmissions" type="crowd"/>
        <CrowdUpdateForm
          :location-id="selectedLocationId"
          :is-submitting="isSubmittingCrowd"
          :show-success="showCrowdSuccess"
          @submit="handleSubmitCrowdUpdate"
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