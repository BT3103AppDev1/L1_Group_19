<script setup>
const legendStops = [
  { label: "No ratings yet", color: "#95a5a6" },
  { label: "1.0-2.0 (Quiet)", color: "#2ecc71" },
  { label: "2.1-3.5 (Moderate)", color: "#f1c40f" },
  { label: "3.6-4.5 (Noisy)", color: "#e67e22" },
  { label: "4.6-5.0 (Very loud)", color: "#e74c3c" },
];
</script>

<template>
  <div class="legend" aria-label="Map legend">
    <div class="legend-title">Average noise rating</div>
    <div v-for="stop in legendStops" :key="stop.label" class="legend-row">
      <span class="legend-swatch" :style="{ background: stop.color }"></span>
      <span>{{ stop.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.legend {
  background: white;
  border: 1px solid #e7e9f1;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  font-size: 13px;
  color: #122033;
}

.legend-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0;
}

.legend-swatch {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
</style>
