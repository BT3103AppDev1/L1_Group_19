<script setup>
import { computed } from "vue";
import { CROWD_FILTER_OPTIONS } from "../utils/locationHelpers";

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<template>
  <div class="filter-bar">
    <label for="crowdFilter" class="filter-label">Filter by crowd:</label>
    <select id="crowdFilter" v-model="selectedValue" class="filter-select">
      <option
        v-for="option in CROWD_FILTER_OPTIONS"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #e7e9f1;
  border-radius: 12px;
}

.filter-label {
  font-size: 14px;
  font-weight: 600;
  color: #122033;
  margin-right: 16px;
}

.filter-select {
  padding: 8px 10px;
  margin-left: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
}
</style>
