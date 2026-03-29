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
  <aside v-if="selectedLocation" class="drawer">
    <div class="drawer-header">
      <h2 class="drawer-title">{{ selectedLocation.name }}</h2>
      <button class="close-btn" type="button" @click="$emit('close')">×</button>
    </div>

    <div class="drawer-body">
      <slot />
    </div>
  </aside>
</template>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 100vw);
  height: 100dvh;
  background: #fff;
  box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.drawer-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #122033;
}

.close-btn {
  border: 0;
  background: transparent;
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  color: #122033;
}

.drawer-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  -webkit-overflow-scrolling: touch;
}
</style>
