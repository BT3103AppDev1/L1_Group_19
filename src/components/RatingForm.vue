<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  locationId: {
    type: String,
    default: "",
  },
  isSubmittingNoise: {
    type: Boolean,
    default: false,
  },
  showSuccess: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);

const userRating = ref(null);
const userComment = ref("");

function resetForm() {
  userRating.value = null;
  userComment.value = "";
}

function handleSubmit() {
  if (!props.locationId || !userRating.value) return;

  emit("submit", {
    rating: userRating.value,
    comment: userComment.value,
  });
}

watch(
  () => props.locationId,
  () => {
    resetForm();
  },
  { immediate: true }
);

watch(
  () => props.showSuccess,
  (showSuccess) => {
    if (showSuccess) resetForm();
  }
);
</script>

<template>
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

    <button class="submit-btn" :disabled="!userRating || isSubmittingNoise" @click="handleSubmit">
      Submit Rating
    </button>

    <p v-if="showSuccess" class="success-msg">✅ Rating submitted!</p>
  </div>
</template>

<style scoped>
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

.comment-input {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  width: 100%;
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
</style>