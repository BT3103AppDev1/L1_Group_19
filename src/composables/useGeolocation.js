import { computed, onBeforeUnmount, ref } from "vue";

const coords = ref(null);
const locationError = ref("");
const isLocating = ref(false);
const lastUpdatedAt = ref(null);
let watchId = null;

function normalizePosition(position) {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
}

function handlePosition(position) {
  coords.value = normalizePosition(position);
  lastUpdatedAt.value = Date.now();
  isLocating.value = false;
  locationError.value = "";
}

function handlePositionError(error) {
  isLocating.value = false;

  switch (error?.code) {
    case error?.PERMISSION_DENIED:
      locationError.value = "Location permission was denied.";
      break;
    case error?.POSITION_UNAVAILABLE:
      locationError.value = "Your location is currently unavailable.";
      break;
    case error?.TIMEOUT:
      locationError.value = "Location request timed out.";
      break;
    default:
      locationError.value = "Unable to retrieve your current location.";
  }
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    locationError.value = "Geolocation is not supported in this browser.";
    return;
  }

  isLocating.value = true;
  locationError.value = "";

  navigator.geolocation.getCurrentPosition(handlePosition, handlePositionError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });
}

function startTrackingLocation() {
  if (!("geolocation" in navigator)) {
    locationError.value = "Geolocation is not supported in this browser.";
    return;
  }

  if (watchId !== null) return;

  isLocating.value = true;
  locationError.value = "";

  watchId = navigator.geolocation.watchPosition(
    handlePosition,
    handlePositionError,
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    }
  );
}

function stopTrackingLocation() {
  if (watchId === null || !("geolocation" in navigator)) return;

  navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

const hasLocation = computed(() => Boolean(coords.value));

onBeforeUnmount(() => {
  stopTrackingLocation();
});

export function useGeolocation() {
  return {
    coords,
    hasLocation,
    locationError,
    isLocating,
    lastUpdatedAt,
    requestLocation,
    startTrackingLocation,
    stopTrackingLocation,
  };
}
