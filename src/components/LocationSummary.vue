<script setup>
defineProps({
  location: {
    type: Object,
    required: true,
  },
  averageRating: {
    type: Number,
    default: null,
  },
  ratingLabelText: {
    type: String,
    required: true,
  },
  submissionCount: {
    type: Number,
    required: true,
  },
  lastUpdated: {
    type: String,
    required: true,
  },
  latestComment: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div>
    <p class="drawer-row">
      <span class="label">Type:</span> {{ location.type }}
    </p>

    <p class="drawer-row">
      <span class="label">Average Rating:</span>
      {{ averageRating === null ? "N/A" : averageRating.toFixed(1) }}
    </p>

    <p class="drawer-row">
      <span class="label">Level:</span> {{ ratingLabelText }}
    </p>

    <p class="drawer-row">
      <span class="label">Submissions:</span> {{ submissionCount }}
    </p>

    <p class="drawer-row">
      <span class="label">Last updated:</span> {{ lastUpdated }}
    </p>

    <p class="drawer-row">
      <span class="label">Comment:</span> {{ latestComment || "No comment provided." }}
    </p>

    <p class="drawer-row">
      <span class="label">Aggregated Noise:</span>
      {{ averageRating === null ? "No data yet" : `${averageRating.toFixed(1)}/5` }}
    </p>
  </div>
</template>

<style scoped>
.drawer-row {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.label {
  display: inline-block;
  min-width: 44px;
  color: #5a667a;
  font-weight: 600;
}
</style>
