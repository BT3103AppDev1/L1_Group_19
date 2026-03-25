<script setup>
defineProps({
  selectedLocation: {
    type: Object,
    default: null,
  },
});

defineEmits(["close"]);
</script>

<template>
  <aside class="drawer" :class="{ open: !!selectedLocation }" aria-label="Location details">
    <div class="drawer-header">
      <h2 class="drawer-title">
        {{ selectedLocation ? selectedLocation.name : "Location details" }}
      </h2>
      <button class="drawer-close" aria-label="Close" @click="$emit('close')">✕</button>
    </div>

    <div v-if="selectedLocation" class="drawer-body">
      <slot />
    </div>

    <div v-else class="drawer-body">
      <p class="drawer-hint">Click a marker to see details.</p>
    </div>
  </aside>
</template>

<style scoped>
.drawer {
  position: fixed;
  right: 18px;
  top: 118px;
  width: min(360px, calc(100vw - 36px));
  background: #fff;
  border: 1px solid #e7e9f1;
  border-radius: 14px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  transform: translateY(12px);
  opacity: 0;
  pointer-events: none;
  transition: 180ms ease;
  z-index: 9999;
}

.drawer.open {
  transform: translateY(0);
  opacity: 1;
  pointer-events: auto;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #eef0f6;
}

.drawer-title {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
}

.drawer-close {
  border: 0;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.drawer-body {
  padding: 12px 14px;
}

.drawer-hint {
  margin: 0;
  color: #5a667a;
  font-size: 14px;
}

@media (max-width: 640px) {
  .drawer {
    left: 14px;
    right: 14px;
    top: auto;
    bottom: 14px;
    width: auto;
  }
}
</style>
