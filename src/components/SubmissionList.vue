<script setup>
defineProps({
  submissions: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div v-if="submissions.length">
    <h4>All submissions</h4>
    <ul class="submission-list">
      <li v-for="submission in submissions" :key="submission.id ?? submission.createdAt" class="submission-item">
        ⭐ {{ submission.rating }} - {{ submission.comment || "No comment" }}
      </li>
    </ul>
  </div>
</template>

<style scoped>
.submission-list {
  padding-left: 18px;
}

.submission-item {
  margin-bottom: 4px;
}
</style>
