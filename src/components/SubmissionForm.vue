<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  locationId: {
    type: String,
    default: "",
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  showSuccess: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);

const userRating = ref("");
const crowdLevel = ref("");
const userComment = ref("");
const errorMessage = ref("");

function resetForm() {
  userRating.value = "";
  crowdLevel.value = "";
  userComment.value = "";
  errorMessage.value = "";
}

function handleSubmit() {
  if (!props.locationId) return;

  if (!userRating.value || !crowdLevel.value) {
    errorMessage.value = "Please select both the noise rating and crowd level.";
    return;
  }

  errorMessage.value = "";

  emit("submit", {
    rating: userRating.value,
    crowdLevel: crowdLevel.value,
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
  <section class="submission-section">
    <h3 class="form-title">Share Current Conditions</h3>

    <form class="form-stack" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="noise-rating">Noise rating</label>
        <select id="noise-rating" v-model="userRating" class="form-control">
          <option disabled value="">Select noise level</option>
          <option value="1">1 - Very Quiet</option>
          <option value="2">2 - Quiet</option>
          <option value="3">3 - Moderate</option>
          <option value="4">4 - Noisy</option>
          <option value="5">5 - Very Loud</option>
        </select>
      </div>

      <div class="form-group">
        <label for="crowd-level">Crowd level</label>
        <select id="crowd-level" v-model="crowdLevel" class="form-control">
          <option disabled value="">Select crowd level</option>
          <option value="Plenty of seats">Plenty of seats</option>
          <option value="Limited seats">Limited seats</option>
          <option value="Full">Full</option>
        </select>
      </div>

      <div class="form-group">
        <label for="submission-comment">Comment (optional)</label>
        <textarea
          id="submission-comment"
          v-model="userComment"
          maxlength="140"
          class="comment-input"
          placeholder="Optional comment (max 140 chars)..."
        />
        <small>{{ userComment.length }}/140</small>
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <p v-if="showSuccess" class="success-msg">Submission submitted.</p>

      <button
        type="submit"
        class="submit-btn"
        :disabled="!userRating || !crowdLevel || isSubmitting"
      >
        {{ isSubmitting ? "Submitting..." : "Submit Update" }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.submission-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #122033;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

label {
  font-size: 0.92rem;
  font-weight: 600;
}

.form-control,
.comment-input {
  width: 100%;
  border: 1px solid #d7dce5;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  font: inherit;
}

.comment-input {
  min-height: 92px;
  resize: vertical;
}

small {
  color: #667085;
}

.submit-btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: #122033;
  color: #fff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #a0a6b5;
  cursor: not-allowed;
}

.error-text {
  margin: 0;
  color: #b42318;
  font-size: 0.9rem;
}

.success-msg {
  margin: 0;
  color: #027a48;
  font-size: 0.9rem;
}
</style>
