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

    <p class="drawer-row metric-row">
      <span class="label">Average Noise Rating:</span>
      <span class="metric-value">
        {{ averageRating === null ? "No recent data" : averageRating.toFixed(1) }}
      </span>
    </p>

    <p class="drawer-row metric-row">
      <span class="label">Noise Level:</span>
      <span class="metric-value metric-level">{{ ratingLabelText }}</span>
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
  </div>
</template>

<style scoped>
.drawer-row {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.label {
  display: inline-block;
  min-width: 120px;
  color: #5a667a;
  font-weight: 600;
}

.metric-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #dbe3f0;
  border-radius: 12px;
  background: linear-gradient(180deg, #fbfcff 0%, #f3f6fb 100%);
}

.metric-value {
  font-size: 16px;
  font-weight: 700;
  color: #122033;
}

.metric-level {
  color: #1f4b7f;
}
</style>
