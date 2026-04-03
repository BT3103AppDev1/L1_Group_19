<script setup>
defineProps({
  locations: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(["select-location"]);

function formatAverage(averageRating) {
  return averageRating === null ? "No ratings yet" : averageRating.toFixed(1);
}
</script>

<template>
  <section class="location-list-shell" aria-label="Sorted location list">
    <div class="location-list-header">
      <h2>Locations</h2>
      <p>Compare spots from the list and tap one to inspect details on the map.</p>
    </div>

    <div v-if="locations.length" class="location-list">
      <button
        v-for="location in locations"
        :key="location.id"
        type="button"
        class="location-item"
        @click="emit('select-location', location)"
      >
        <span class="location-rank">{{ location.rank }}</span>

        <div class="location-copy">
          <strong>{{ location.name }}</strong>
          <span>{{ location.type }}</span>
        </div>

        <div class="location-metrics">
          <span class="noise-label">{{ location.noiseLabel }}</span>
          <span class="noise-rating">{{ formatAverage(location.averageRating) }}</span>
        </div>
      </button>
    </div>

    <p v-else class="empty-state">No locations match the current filters.</p>
  </section>
</template>

<style scoped>
.location-list-shell {
  padding: 16px;
  background: white;
  border: 1px solid #e7e9f1;
  border-radius: 14px;
  max-height: min(48dvh, 560px);
  overflow-y: auto;
}

.location-list-header {
  margin-bottom: 12px;
}

.location-list-header h2 {
  margin: 0;
  font-size: 18px;
}

.location-list-header p {
  margin: 4px 0 0 0;
  color: #5a667a;
  font-size: 13px;
}

.location-list {
  display: grid;
  gap: 10px;
}

.location-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px;
  border: 1px solid #e7e9f1;
  border-radius: 12px;
  background: #fbfcff;
  cursor: pointer;
  text-align: left;
}

.location-item:hover {
  border-color: #cfd7ea;
  background: #f6f8fd;
}

.location-rank {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #122033;
  color: white;
  font-size: 13px;
  font-weight: 700;
}

.location-copy {
  min-width: 0;
}

.location-copy strong,
.location-copy span,
.location-metrics span {
  display: block;
}

.location-copy strong {
  font-size: 14px;
  color: #122033;
}

.location-copy span {
  margin-top: 2px;
  font-size: 12px;
  color: #5a667a;
}

.location-metrics {
  text-align: right;
}

.noise-label {
  font-size: 13px;
  font-weight: 600;
  color: #122033;
}

.noise-rating {
  margin-top: 2px;
  font-size: 12px;
  color: #5a667a;
}

.empty-state {
  margin: 0;
  font-size: 14px;
  color: #5a667a;
}

@media (max-width: 640px) {
  .location-item {
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .location-metrics {
    grid-column: 2;
    text-align: left;
  }
}
</style>
