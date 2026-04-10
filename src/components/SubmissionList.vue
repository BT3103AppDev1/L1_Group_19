<script setup>
import { computed, reactive, ref } from "vue";

const FLAG_REASON_OPTIONS = [
  { value: "outdated", label: "Outdated" },
  { value: "incorrect_noise_level", label: "Incorrect noise level" },
  { value: "spam_or_abuse", label: "Spam or abuse" },
  { value: "other", label: "Other" },
];

const props = defineProps({
  submissions: {
    type: Array,
    required: true,
  },
  type: {
    type: String,
    required: true, // "noise" or "crowd"
  },
  flagCounts: {
    type: Object,
    default: () => ({}),
  },
  isSubmittingFlag: {
    type: Boolean,
    default: false,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
});

const emit = defineEmits(["flag-submission", "load-more"]);

const activeFlagSubmissionId = ref("");
const reasonBySubmissionId = reactive({});
const notesBySubmissionId = reactive({});

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
        !Number.isNaN(submission.rating) &&
        submission.comment &&
        submission.comment.trim().length > 0
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

const hasMoreSubmissions = computed(() => {
  return props.totalCount > props.submissions.length;
});

function getFlagCount(submissionId) {
  return props.flagCounts[submissionId] ?? 0;
}

function openFlagForm(submissionId) {
  activeFlagSubmissionId.value = submissionId;
  reasonBySubmissionId[submissionId] = FLAG_REASON_OPTIONS[0].value;
  notesBySubmissionId[submissionId] = "";
}

function cancelFlagForm(submissionId) {
  if (activeFlagSubmissionId.value === submissionId) {
    activeFlagSubmissionId.value = "";
  }

  reasonBySubmissionId[submissionId] = FLAG_REASON_OPTIONS[0].value;
  notesBySubmissionId[submissionId] = "";
}

function submitFlag(submission) {
  const reason = reasonBySubmissionId[submission.submissionId];
  if (!reason) return;

  emit("flag-submission", {
    submissionId: submission.submissionId,
    locationId: submission.locationId,
    reason,
    notes: notesBySubmissionId[submission.submissionId] ?? "",
  });

  reasonBySubmissionId[submission.submissionId] = FLAG_REASON_OPTIONS[0].value;
  notesBySubmissionId[submission.submissionId] = "";
  activeFlagSubmissionId.value = "";
}
</script>

<template>
  <div v-if="filteredSubmissions.length">
    <h4>{{ type === "noise" ? "Latest Noise Comments" : "Crowd Level" }}</h4>

    <ul class="submission-list">
      <li
        v-for="submission in filteredSubmissions"
        :key="submission.id ?? submission.createdAt"
        class="submission-item"
      >
        <div v-if="type === 'noise'" class="main-row">
          <span class="rating-badge">⭐ {{ submission.rating }}</span>
          <span>{{ submission.comment }}</span>
        </div>

        <div v-else class="main-row">
          {{ submission.crowdLevel }}
        </div>

        <div class="timestamp-row">
          {{ formatDate(submission.createdAt) }}
        </div>

        <div v-if="type === 'noise'" class="flag-row">
          <button
            type="button"
            class="flag-button"
            @click="openFlagForm(submission.submissionId)"
          >
            Flag inaccurate
          </button>
          <span class="flag-count">
            {{ getFlagCount(submission.submissionId) }} report{{
              getFlagCount(submission.submissionId) === 1 ? "" : "s"
            }}
          </span>
        </div>

        <form
          v-if="type === 'noise' && activeFlagSubmissionId === submission.submissionId"
          class="flag-form"
          @submit.prevent="submitFlag(submission)"
        >
          <label :for="`flag-reason-${submission.submissionId}`" class="flag-label">
            Reason
          </label>
          <select
            :id="`flag-reason-${submission.submissionId}`"
            v-model="reasonBySubmissionId[submission.submissionId]"
            class="flag-select"
          >
            <option
              v-for="option in FLAG_REASON_OPTIONS"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <label :for="`flag-notes-${submission.submissionId}`" class="flag-label">
            Notes (optional)
          </label>
          <textarea
            :id="`flag-notes-${submission.submissionId}`"
            v-model="notesBySubmissionId[submission.submissionId]"
            class="flag-textarea"
            rows="2"
            maxlength="200"
            placeholder="Add more detail for review"
          />

          <div class="flag-actions">
            <button type="submit" class="flag-submit" :disabled="isSubmittingFlag">
              {{ isSubmittingFlag ? "Submitting..." : "Submit flag" }}
            </button>
            <button
              type="button"
              class="flag-cancel"
              @click="cancelFlagForm(submission.submissionId)"
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    </ul>

    <button
      v-if="hasMoreSubmissions"
      type="button"
      class="load-more-button"
      @click="$emit('load-more')"
    >
      Load more {{ type === "noise" ? "comments" : "entries" }}
    </button>
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
  display: flex;
  gap: 8px;
  align-items: center;
}

.timestamp-row {
  margin-top: 4px;
  font-size: 12px;
  color: #667085;
}

.rating-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef3fb;
  color: #1f4b7f;
  font-weight: 700;
  white-space: nowrap;
}

.flag-row {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.flag-button,
.flag-submit,
.flag-cancel {
  border: 0;
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
  cursor: pointer;
}

.flag-button,
.flag-submit {
  background: #122033;
  color: #fff;
}

.flag-cancel {
  background: #eef1f6;
  color: #122033;
}

.flag-count {
  font-size: 12px;
  color: #5a667a;
  font-weight: 600;
}

.flag-form {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #e2e8f4;
  border-radius: 12px;
  background: #fbfcff;
}

.flag-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #5a667a;
}

.flag-select,
.flag-textarea {
  width: 100%;
  margin-bottom: 10px;
  padding: 9px 10px;
  border: 1px solid #d6dbe7;
  border-radius: 10px;
  background: #fff;
  font: inherit;
}

.flag-actions {
  display: flex;
  gap: 8px;
}

.load-more-button {
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px 16px;
  border: 1px solid #dbe3f0;
  border-radius: 10px;
  background: #f8fafc;
  color: #1f4b7f;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.load-more-button:hover {
  background: #f0f4fa;
  border-color: #c7d5e8;
}

.load-more-button:active {
  background: #e8eef8;
}
</style>
