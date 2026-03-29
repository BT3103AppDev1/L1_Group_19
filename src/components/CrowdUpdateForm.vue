<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  locationId: {
    type: String,
    default: "",
  },
  isSubmittingCrowd: {
    type: Boolean,
    default: false,
  },
  showSuccess: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit"]);

const crowdLevel = ref("");
const photo = ref(null);
const errorMessage = ref("");

function handlePhotoChange(event) {
  const file = event.target.files?.[0] ?? null;
  photo.value = file;
}

function handleSubmit() {
  if (!crowdLevel.value) {
    errorMessage.value = "Please select a crowd level.";
    return;
  }

  errorMessage.value = "";

  emit("submit", {
    crowdLevel: crowdLevel.value,
    photo: photo.value,
  });

  crowdLevel.value = "";
  photo.value = null;
}
watch(
  () => props.locationId,
  () => {
    crowdLevel.value = "";
    photo.value = null;
    errorMessage.value = "";
  }
);
</script>

<template>
  <section class="crowd-form">
    <h3 class="form-title">Crowd Level</h3>

    <form @submit.prevent="handleSubmit" class="form-stack">
      <div class="form-group">
        <select id="crowd-level" v-model="crowdLevel">
          <option disabled value="">Select crowd level</option>
          <option value="Plenty of seats">Plenty of seats</option>
          <option value="Limited seats">Limited seats</option>
          <option value="Full">Full</option>
        </select>
      </div>

      <div class="form-group">
        <label for="crowd-photo">Photo (optional)</label>
        <input
          id="crowd-photo"
          type="file"
          accept="image/*"
          @change="handlePhotoChange"
        />
      </div>

      <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      <p v-if="showSuccess" class="success-text">Crowd update submitted.</p>

      <button type="submit" class="submit-btn">
        {{ isSubmitting ? "Submitting..." : "Submit Crowd Update" }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.crowd-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
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

select,
input[type="file"] {
  width: 100%;
  border: 1px solid #d7dce5;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  font: inherit;
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

.error-text {
  margin: 0;
  color: #b42318;
  font-size: 0.9rem;
}

.success-text {
  margin: 0;
  color: #027a48;
  font-size: 0.9rem;
}
</style>