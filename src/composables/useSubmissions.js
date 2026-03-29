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

  if (typeof timestamp.toMillis === "function") {
    return timestamp.toMillis();
  }

  if (typeof timestamp.seconds === "number") {
    return timestamp.seconds * 1000;
  }

  return null;
}

export function useSubmissions() {
  const submissions = ref([]);
  const isSubmittingNoise = ref(false);
  const isSubmittingCrowd = ref(false);
  const submissionError = ref(null);
  let unsubscribeSubmissions = null;

  function subscribeToSubmissions() {
    const submissionsRef = collection(db, "submissions");

    unsubscribeSubmissions = onSnapshot(
      submissionsRef,
      { serverTimestamps: "estimate"},
      (snapshot) => {
        submissions.value = snapshot.docs
          .map((doc) => {
            const data = doc.data({ serverTimestamps: "estimate" });

            return {
              id: doc.id,
              locationId: data.locationId,
              rating:
                data.rating !== undefined && data.rating !== null
                  ? Number(data.rating)
                  : null,
              comment: data.comment ?? "",
              crowdLevel: data.crowdLevel ?? "",
              photoUrl: data.photoUrl ?? "",
              createdAt: toMillis(data.createdAt),
            };
            })
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

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
    return submissions.value.filter(
      (submission) => submission.locationId === locationId
    );
  }

  function getAverageRating(locationId) {
    const locationSubs = getSubmissionsByLocation(locationId).filter(
      (submission) => submission.rating !== null && !Number.isNaN(submission.rating)
    );

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
    const locationSubs = getSubmissionsByLocation(locationId)
      .filter((submission) => submission.comment && submission.comment.trim().length > 0);

    if (!locationSubs.length) return null;

    return locationSubs.reduce((latest, current) =>
      (current.createdAt ?? 0) > (latest.createdAt ?? 0) ? current : latest
    ).comment;
  }

  function lastUpdatedText(locationId) {
    const latest = getLatestSubmission(locationId);
    if (!latest) return "No ratings yet";
    return formatRelativeTime(latest.createdAt);
  }

  async function submitRating({ locationId, rating, comment }) {
    if (!locationId || !rating) return;

    isSubmittingNoise.value = true;

    try {
      await addDoc(collection(db, "submissions"), {
        locationId,
        rating: parseInt(rating, 10),
        comment: comment.trim(),
        crowdLevel: "",
        photoUrl: "",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to submit rating to Firestore:", err);
      submissionError.value = err;
      throw err;
    } finally {
      isSubmittingNoise.value = false;
    }
  }

  async function submitCrowdUpdate({ locationId, crowdLevel }) {
    if (!locationId || !crowdLevel) return;

    isSubmittingCrowd.value = true;

    try {
      await addDoc(collection(db, "submissions"), {
        locationId,
        rating: null,
        comment: "",
        crowdLevel,
        photoUrl: "",
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to submit crowd update to Firestore:", err);
      submissionError.value = err;
      throw err;
    } finally {
      isSubmittingCrowd.value = false;
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
    isSubmittingNoise,
    isSubmittingCrowd,
    submissionError,
    submitRating,
    submitCrowdUpdate,
    getSubmissionsByLocation,
    getAverageRating,
    getLatestSubmission,
    getLatestComment,
    lastUpdatedText,
  };
}
