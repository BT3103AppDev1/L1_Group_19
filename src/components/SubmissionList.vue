<script setup>
import { computed } from "vue";

const props = defineProps({
  submissions: {
    type: Array,
    required: true,
  },
  type: {
    type: String,
    required: true, // "noise" or "crowd"
  },
});

function formatDate(createdAt) {
  if (!createdAt) return "Unknown time";
  return new Date(createdAt).toLocaleString();
}

const filteredSubmissions = computed(() => {
  if (props.type === "noise") {
    return props.submissions.filter(
      (submission) =>
        submission.rating !== null &&
        submission.rating !== undefined &&
        !Number.isNaN(submission.rating)
    );
  }

  if (props.type === "crowd") {
    return props.submissions.filter(
      (submission) =>
        submission.crowdLevel &&
        submission.crowdLevel.trim().length > 0
    );
  }

  return [];
});
</script>

<template>
  <div v-if="filteredSubmissions.length">
    <h4>{{ type === "noise" ? "Noise Level" : "Crowd Level" }}</h4>

    <ul class="submission-list">
      <li
        v-for="submission in filteredSubmissions"
        :key="submission.id ?? submission.createdAt"
        class="submission-item"
      >
        <div v-if="type === 'noise'" class="main-row">
          ⭐ {{ submission.rating }} - {{ submission.comment || "No comment" }}
        </div>

        <div v-else class="main-row">
          {{ submission.crowdLevel }}
        </div>

        <div class="timestamp-row">
          {{ formatDate(submission.createdAt) }}
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.submission-list {
  padding-left: 18px;
}

.submission-item {
  margin-bottom: 12px;
}

.main-row {
  font-size: 14px;
  color: #122033;
}

.timestamp-row {
  margin-top: 4px;
  font-size: 12px;
  color: #667085;
}
</style>