import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  addDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatRelativeTime } from "../utils/locationHelpers";

function toMillis(timestamp) {
  if (!timestamp) return null;
  if (typeof timestamp.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  return null;
}

export function useSubmissions() {
  const submissions = ref([]);
  const isSubmitting = ref(false);
  const submissionError = ref(null);
  let unsubscribeSubmissions = null;

  function subscribeToSubmissions() {
    const submissionsRef = collection(db, "submissions");

    unsubscribeSubmissions = onSnapshot(
      submissionsRef,
      (snapshot) => {
        submissions.value = snapshot.docs
          .map((doc) => {
            const data = doc.data();

            return {
              id: doc.id,
              locationId: data.locationId,
              rating: Number(data.rating),
              comment: data.comment ?? "",
              createdAt: toMillis(data.createdAt),
            };
          })
          .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));

        submissionError.value = null;
      },
      (err) => {
        console.error("Failed to listen for Firestore submissions:", err);
        submissions.value = [];
        submissionError.value = err;
      }
    );
  }

  function getSubmissionsByLocation(locationId) {
    return submissions.value.filter((submission) => submission.locationId === locationId);
  }

  function getAverageRating(locationId) {
    const locationSubs = getSubmissionsByLocation(locationId);
    if (!locationSubs.length) return null;

    const total = locationSubs.reduce((sum, submission) => sum + submission.rating, 0);
    return total / locationSubs.length;
  }

  function getLatestSubmission(locationId) {
    const locationSubs = getSubmissionsByLocation(locationId);
    if (!locationSubs.length) return null;

    return locationSubs.reduce((latest, current) =>
      (current.createdAt ?? 0) > (latest.createdAt ?? 0) ? current : latest
    );
  }

  function getLatestComment(locationId) {
    const latest = getLatestSubmission(locationId);
    return latest ? latest.comment : null;
  }

  function lastUpdatedText(locationId) {
    const latest = getLatestSubmission(locationId);
    if (!latest) return "No ratings yet";
    return formatRelativeTime(latest.createdAt);
  }

  async function submitRating({ locationId, rating, comment }) {
    if (!locationId || !rating) return;

    isSubmitting.value = true;

    try {
      await addDoc(collection(db, "submissions"), {
        locationId,
        rating: parseInt(rating, 10),
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to submit rating to Firestore:", err);
      submissionError.value = err;
      throw err;
    } finally {
      isSubmitting.value = false;
    }
  }

  onMounted(() => {
    subscribeToSubmissions();
  });

  onBeforeUnmount(() => {
    if (unsubscribeSubmissions) unsubscribeSubmissions();
  });

  return {
    submissions,
    isSubmitting,
    submissionError,
    submitRating,
    getSubmissionsByLocation,
    getAverageRating,
    getLatestSubmission,
    getLatestComment,
    lastUpdatedText,
  };
}
