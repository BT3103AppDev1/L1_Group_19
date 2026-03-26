<script setup>
import { computed } from "vue";

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
    <label for="typeFilter" class="filter-label">Filter by type:</label>
    <select id="typeFilter" v-model="selectedValue" class="filter-select">
      <option value="all">All types</option>
      <option value="Library">Library</option>
      <option value="Study Room">Study Room</option>
      <option value="Café">Café</option>
      <option value="Study Area">Study Area</option>
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
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  background: white;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
</style>