<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  user: Object,
  authError: {
    type: [String, Object],
    default: null,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  locationCoords: {
    type: Object,
    default: null,
  },
  isLocating: {
    type: Boolean,
    default: false,
  },
  locationError: {
    type: String,
    default: "",
  },
  lastLocationUpdatedAt: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["login", "signup", "logout", "request-location"]);

const mode = ref("login");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const localError = ref("");

const authErrorMessage = computed(() => {
  if (!props.authError) return "";
  if (typeof props.authError === "string") return props.authError;
  if (props.authError.message) return props.authError.message;
  return String(props.authError);
});

function switchMode(newMode) {
  mode.value = newMode;
  localError.value = "";
}

function handleSubmit() {
  localError.value = "";

  if (!email.value || !password.value) {
    localError.value = "Please enter a valid email and password.";
    return;
  }

  if (mode.value === "signup") {
    if (password.value.length < 6) {
      localError.value = "Password must be at least 6 characters.";
      return;
    }
    if (password.value !== confirmPassword.value) {
      localError.value = "Passwords do not match.";
      return;
    }

    emit("signup", { email: email.value, password: password.value });
    return;
  }

  emit("login", { email: email.value, password: password.value });
}

watch(
  () => props.user,
  (value) => {
    if (value) {
      email.value = "";
      password.value = "";
      confirmPassword.value = "";
      localError.value = "";
    }
  }
);
</script>

<template>
  <section class="auth-card">
    <div class="auth-header">
      <h2>Account</h2>
      <p v-if="props.user">Signed in as <strong>{{ props.user.email }}</strong></p>
      <p v-else>Log in or sign up to submit updates.</p>
    </div>

    <div v-if="props.user" class="auth-actions">
      <button class="primary-btn" @click="$emit('logout')">Sign out</button>
    </div>

    <div v-else>
      <div class="auth-toggle">
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: mode === 'login' }"
          @click="switchMode('login')"
        >
          Login
        </button>
        <button
          type="button"
          class="toggle-btn"
          :class="{ active: mode === 'signup' }"
          @click="switchMode('signup')"
        >
          Sign Up
        </button>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <label>
          Email
          <input type="email" v-model.trim="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" v-model="password" placeholder="Enter password" />
        </label>

        <label v-if="mode === 'signup'">
          Confirm password
          <input type="password" v-model="confirmPassword" placeholder="Repeat password" />
        </label>

        <p v-if="localError || authErrorMessage" class="auth-error">
          {{ localError || authErrorMessage }}
        </p>

        <button type="submit" class="primary-btn" :disabled="props.isLoading">
          {{ props.isLoading ? 'Working...' : mode === 'signup' ? 'Create account' : 'Log in' }}
        </button>
      </form>
    </div>

    <div class="location-panel">
      <div class="location-panel-copy">
        <h3>Device location</h3>
        <p v-if="props.locationCoords">
          Lat {{ props.locationCoords.latitude.toFixed(5) }}, Lng {{ props.locationCoords.longitude.toFixed(5) }}
        </p>
        <p v-else-if="props.locationError">{{ props.locationError }}</p>
        <p v-else>Allow location access so proximity checks can be added next.</p>
        <small v-if="props.lastLocationUpdatedAt">
          Last updated {{ new Date(props.lastLocationUpdatedAt).toLocaleTimeString() }}
        </small>
      </div>

      <button
        type="button"
        class="secondary-btn"
        :disabled="props.isLocating"
        @click="$emit('request-location')"
      >
        {{ props.isLocating ? "Locating..." : props.locationCoords ? "Refresh location" : "Enable location" }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.auth-card {
  background: white;
  border: 1px solid #e7e9f1;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 8px 24px rgba(11, 22, 50, 0.08);
  margin-bottom: 18px;
}

.auth-header {
  margin-bottom: 16px;
}

.auth-header h2 {
  margin: 0 0 6px;
  font-size: 1rem;
}

.auth-header p {
  margin: 0;
  color: #5a667a;
  font-size: 0.92rem;
}

.auth-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.toggle-btn {
  flex: 1;
  border: 1px solid #d7dce5;
  background: white;
  color: #122033;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
}

.toggle-btn.active {
  border-color: #122033;
  background: #122033;
  color: #fff;
}

.auth-form {
  display: grid;
  gap: 12px;
}

.auth-form label {
  display: grid;
  gap: 8px;
  font-size: 0.9rem;
  color: #122033;
}

.auth-form input {
  border: 1px solid #d7dce5;
  border-radius: 12px;
  padding: 10px 12px;
  font: inherit;
  background: #fff;
}

.primary-btn {
  border: 0;
  border-radius: 12px;
  background: #122033;
  color: white;
  padding: 12px 14px;
  font: inherit;
  cursor: pointer;
}

.primary-btn:disabled {
  background: #a0a6b5;
  cursor: not-allowed;
}

.auth-actions {
  display: flex;
  justify-content: flex-start;
}

.auth-error {
  margin: 0;
  color: #b42318;
  font-size: 0.92rem;
}

.location-panel {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eef0f6;
  display: grid;
  gap: 12px;
}

.location-panel-copy h3 {
  margin: 0 0 6px;
  font-size: 0.95rem;
}

.location-panel-copy p,
.location-panel-copy small {
  display: block;
}

.location-panel-copy p {
  margin: 0;
  color: #5a667a;
  font-size: 0.92rem;
}

.location-panel-copy small {
  margin-top: 6px;
  color: #667085;
}

.secondary-btn {
  border: 1px solid #d7dce5;
  border-radius: 12px;
  background: white;
  color: #122033;
  padding: 10px 12px;
  font: inherit;
  cursor: pointer;
}

.secondary-btn:disabled {
  color: #98a2b3;
  cursor: not-allowed;
}
</style>
