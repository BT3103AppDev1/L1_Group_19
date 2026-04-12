import { onBeforeUnmount, onMounted, ref } from "vue";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { formatRelativeTime } from "../utils/locationHelpers";

const RECENT_SUBMISSION_WINDOW_MS = 180 * 60 * 1000;
const CROWD_FRESHNESS_WINDOW_MS = 180 * 60 * 1000;
const CROWD_CATEGORIES = ["Plenty of seats", "Limited seats", "Full"];
const CROWD_VALUE_BY_LABEL = {
  "Plenty of seats": 1,
  "Limited seats": 2,
  Full: 3,
};

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

function normalizeSubmissionId(docId, data) {
  return String(data?.submissionId ?? docId ?? "");
}

function normalizeFlagSubmissionId(data) {
  return String(
    data?.submissionId ??
      data?.flaggedSubmissionId ??
      data?.submissionRefId ??
      ""
  );
}

function normalizeSubmittedBy(data) {
  if (!data?.submittedBy || typeof data.submittedBy !== "object") {
    return null;
  }

  const uid = data.submittedBy.uid ? String(data.submittedBy.uid) : "";
  const email = data.submittedBy.email ? String(data.submittedBy.email) : null;

  if (!uid) return null;

  return { uid, email };
}

function normalizeCrowdLevel(label) {
  const normalizedLabel = String(label ?? "").trim();

  if (
    normalizedLabel === "Plenty of seats" ||
    normalizedLabel === "Limited seats" ||
    normalizedLabel === "Full"
  ) {
    return normalizedLabel;
  }

  if (normalizedLabel === "Plenty") return "Plenty of seats";
  if (normalizedLabel === "Low") return "Plenty of seats";
  if (normalizedLabel === "Medium") return "Limited seats";
  if (normalizedLabel === "High") return "Full";

  return "";
}

function getCrowdWeight(ageMs) {
  const ageMinutes = ageMs / (60 * 1000);

  if (ageMinutes < 0 || ageMinutes > 180) return 0;
  if (ageMinutes <= 20) return 3;
  if (ageMinutes <= 40) return 2.5;
  if (ageMinutes <= 60) return 2;
  if (ageMinutes <= 120) return 1;
  return 0.5;
}

export function useSubmissions() {
  const submissions = ref([]);
  const submissionFlags = ref([]);
  const isSubmittingSubmission = ref(false);
  const isSubmittingFlag = ref(false);
  const submissionError = ref(null);
  const isLiveConnected = ref(false);
  const lastSyncAt = ref(null);
  let unsubscribeSubmissions = null;
  let unsubscribeFlags = null;
  let pollingTimer = null;

  async function fetchSubmissionsOnce() {
    try {
      const snapshot = await getDocs(collection(db, "submissions"));

      submissions.value = snapshot.docs
        .map((doc) => {
          const data = doc.data();

        return {
          id: doc.id,
          submissionId: normalizeSubmissionId(doc.id, data),
          locationId: data.locationId,
          rating:
            data.rating !== undefined && data.rating !== null
              ? Number(data.rating)
              : null,
          comment: data.comment ?? "",
          crowdLevel: normalizeCrowdLevel(data.crowdLevel),
          createdAt: toMillis(data.createdAt),
          unlockUntil:
            data.unlockUntil !== undefined && data.unlockUntil !== null
              ? Number(data.unlockUntil)
              : 0,
          submittedBy: normalizeSubmittedBy(data),
        };
      })
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

      lastSyncAt.value = Date.now();
    } catch (err) {
      console.error("Polling fetch failed:", err);
    }
  }

  function startPolling(intervalMs = 5 * 60 * 1000) {
    stopPolling();

    pollingTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchSubmissionsOnce();
      }
    }, intervalMs);
  }

  function stopPolling() {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
  }

  function subscribeToSubmissions() {
    const submissionsRef = collection(db, "submissions");

    unsubscribeSubmissions = onSnapshot(
      submissionsRef,
      { serverTimestamps: "estimate" },
      (snapshot) => {
        submissions.value = snapshot.docs
          .map((doc) => {
            const data = doc.data({ serverTimestamps: "estimate" });

            return {
              id: doc.id,
              submissionId: normalizeSubmissionId(doc.id, data),
              locationId: data.locationId,
              rating:
                data.rating !== undefined && data.rating !== null
                ? Number(data.rating)
                : null,
              comment: data.comment ?? "",
              crowdLevel: normalizeCrowdLevel(data.crowdLevel),
              createdAt: toMillis(data.createdAt),
              unlockUntil:
                data.unlockUntil !== undefined && data.unlockUntil !== null
                  ? Number(data.unlockUntil)
                  : 0,
              submittedBy: normalizeSubmittedBy(data),
            };
          })
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        stopPolling();
        isLiveConnected.value = true;
        lastSyncAt.value = Date.now();
        submissionError.value = null;
      },
      (err) => {
        console.error("Failed to listen for Firestore submissions:", err);
        isLiveConnected.value = false;
        submissionError.value = err;
        startPolling();
      }
    );
  }

  function subscribeToSubmissionFlags() {
    unsubscribeFlags = onSnapshot(
      collection(db, "submission_flags"),
      { serverTimestamps: "estimate" },
      (snapshot) => {
        submissionFlags.value = snapshot.docs.map((flagDoc) => {
          const data = flagDoc.data({ serverTimestamps: "estimate" });

          return {
            id: flagDoc.id,
            submissionId: normalizeFlagSubmissionId(data),
            locationId: data.locationId ?? "",
            submissionType: data.submissionType ?? "",
            reason: data.reason ?? "",
            notes: data.notes ?? "",
            createdAt: toMillis(data.createdAt),
          };
        });
      },
      (err) => {
        console.error("Failed to listen for submission flags:", err);
        submissionError.value = err;
      }
    );
  }

  function getFlagCount(submissionId) {
    const normalizedSubmissionId = String(submissionId ?? "");

    return submissionFlags.value.filter(
      (flag) => String(flag.submissionId ?? "") === normalizedSubmissionId
    ).length;
  }

  function isSubmissionInvalid(submissionId) {
    return getFlagCount(submissionId) >= 2;
  }

  function getSubmissionsByLocation(locationId) {
    return submissions.value.filter(
      (submission) =>
        submission.locationId === locationId &&
        !isSubmissionInvalid(submission.submissionId)
    );
  }

  function getRecentSubmissionsByLocation(locationId) {
    const now = Date.now();

    return getSubmissionsByLocation(locationId).filter(
      (submission) =>
        submission.createdAt !== null &&
        submission.createdAt !== undefined &&
        now - submission.createdAt <= RECENT_SUBMISSION_WINDOW_MS
    );
  }

  function getAverageRating(locationId) {
    const locationSubs = getRecentSubmissionsByLocation(locationId).filter(
      (submission) => submission.rating !== null && !Number.isNaN(submission.rating)
    );

    if (!locationSubs.length) return null;

    const total = locationSubs.reduce((sum, submission) => sum + submission.rating, 0);
    return total / locationSubs.length;
  }

  function getAverageCrowdRating(locationId) {
    const crowdValues = getRecentCrowdSubmissionsByLocation(locationId)
      .map((submission) => CROWD_VALUE_BY_LABEL[submission.crowdLevel])
      .filter((value) => value !== undefined && value !== null);

    if (!crowdValues.length) return null;

    const total = crowdValues.reduce((sum, value) => sum + value, 0);
    return total / crowdValues.length;
  }

  function getLatestSubmission(locationId) {
    const locationSubs = getRecentSubmissionsByLocation(locationId);
    if (!locationSubs.length) return null;

    return locationSubs.reduce((latest, current) =>
      (current.createdAt ?? 0) > (latest.createdAt ?? 0) ? current : latest
    );
  }

  function getRecentCrowdSubmissionsByLocation(locationId) {
    const now = Date.now();

    return getSubmissionsByLocation(locationId).filter((submission) => {
      if (!submission.crowdLevel) return false;
      if (submission.createdAt === null || submission.createdAt === undefined) {
        return false;
      }

      return now - submission.createdAt <= CROWD_FRESHNESS_WINDOW_MS;
    });
  }

  function getWeightedCrowdScore(locationId) {
    const now = Date.now();
    const crowdSubs = getRecentCrowdSubmissionsByLocation(locationId);

    if (!crowdSubs.length) return null;

    let weightedTotal = 0;
    let totalWeight = 0;

    crowdSubs.forEach((submission) => {
      const crowdValue = CROWD_VALUE_BY_LABEL[submission.crowdLevel];
      const weight = getCrowdWeight(now - submission.createdAt);

      if (!crowdValue || !weight) return;

      weightedTotal += crowdValue * weight;
      totalWeight += weight;
    });

    if (!totalWeight) return null;

    return weightedTotal / totalWeight;
  }

  function getDerivedCrowdStatus(locationId) {
    const weightedScore = getWeightedCrowdScore(locationId);

    if (weightedScore === null) return "Unknown";
    if (weightedScore < 1.5) return "Plenty of seats";
    if (weightedScore < 2.5) return "Limited seats";
    return "Full";
  }

  function getLatestComment(locationId) {
    const locationSubs = getRecentSubmissionsByLocation(locationId)
      .filter((submission) => submission.comment && submission.comment.trim().length > 0);

    if (!locationSubs.length) return null;

    return locationSubs.reduce((latest, current) =>
      (current.createdAt ?? 0) > (latest.createdAt ?? 0) ? current : latest
    ).comment;
  }

  function lastUpdatedText(locationId) {
    const latest = getLatestSubmission(locationId);
    if (!latest) return "No recent data";
    return formatRelativeTime(latest.createdAt);
  }

  function hasUserSubmittedReview(uid) {
    const normalizedUid = String(uid ?? "");
    if (!normalizedUid) return false;

    return submissions.value.some(
      (submission) =>
        String(submission?.submittedBy?.uid ?? "") === normalizedUid &&
        Boolean(submission.locationId) &&
        submission.rating !== null &&
        !Number.isNaN(submission.rating) &&
        Boolean(submission.crowdLevel)
    );
  }

  function getUserUnlockUntil(uid) {
    const normalizedUid = String(uid ?? "");
    if (!normalizedUid) return 0;

    const userSubs = submissions.value.filter(
      (submission) =>
        String(submission?.submittedBy?.uid ?? "") === normalizedUid &&
        submission.unlockUntil
    );

    if (!userSubs.length) return 0;

    const latest = userSubs.reduce((latestSubmission, currentSubmission) =>
      (currentSubmission.unlockUntil ?? 0) > (latestSubmission.unlockUntil ?? 0)
        ? currentSubmission
        : latestSubmission
    );

    return latest.unlockUntil ?? 0;
  }

  async function submitSubmission({ locationId, rating, crowdLevel, comment, user }) {
    if (!locationId || !rating || !crowdLevel) return;
  
    if (!CROWD_CATEGORIES.includes(crowdLevel)) {
      const err = new Error("Invalid crowd category.");
      submissionError.value = err;
      throw err;
    }
  
    isSubmittingSubmission.value = true;

    try {
      const submissionRef = doc(collection(db, "submissions"));

      const now = Date.now();
      const unlockUntil = now + 72 * 60 * 60 * 1000; 

      await setDoc(submissionRef, {
        submissionId: submissionRef.id,
        locationId,
        rating: parseInt(rating, 10),
        comment: comment.trim(),
        crowdLevel,
        createdAt: serverTimestamp(),
        createdAtMs: now,
        unlockUntil,
        submittedBy: user
          ? {
              uid: user.uid,
              email: user.email ?? null,
            }
          : null,
      });

      localStorage.setItem("unlockUntil", String(unlockUntil));
      return unlockUntil;
    } catch (err) {
      console.error("Failed to submit combined submission to Firestore:", err);
      submissionError.value = err;
      throw err;
    } finally {
      isSubmittingSubmission.value = false;
    }
  }

    async function flagSubmission({ submissionId, locationId, reason, notes = "" }) {
      if (!submissionId || !locationId || !reason) return;

      isSubmittingFlag.value = true;

      try {
        await addDoc(collection(db, "submission_flags"), {
          submissionId,
          locationId,
          submissionType: "noise",
          reason,
          notes: notes.trim(),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.error("Failed to flag submission in Firestore:", err);
        submissionError.value = err;
        throw err;
      } finally {
        isSubmittingFlag.value = false;
      }
    }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      if (!unsubscribeSubmissions) subscribeToSubmissions();
    } else {
      if (unsubscribeSubmissions) {
        unsubscribeSubmissions();
        unsubscribeSubmissions = null;
      }
    }
  }
  
  onMounted(() => {
    subscribeToSubmissions();
    subscribeToSubmissionFlags();
    document.addEventListener("visibilitychange", handleVisibilityChange);
  });
  
  onBeforeUnmount(() => {
    if (unsubscribeSubmissions) unsubscribeSubmissions();
    if (unsubscribeFlags) unsubscribeFlags();
    stopPolling();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  });

  return {
    submissions,
    submissionFlags,
    isSubmittingSubmission,
    isSubmittingFlag,
    submissionError,
    isLiveConnected,
    lastSyncAt,
    submitSubmission,
    flagSubmission,
    getFlagCount,
    isSubmissionInvalid,
    getSubmissionsByLocation,
    getRecentSubmissionsByLocation,
    getRecentCrowdSubmissionsByLocation,
    getAverageRating,
    getAverageCrowdRating,
    getWeightedCrowdScore,
    getDerivedCrowdStatus,
    getLatestSubmission,
    getLatestComment,
    lastUpdatedText,
    hasUserSubmittedReview,
    getUserUnlockUntil,
    CROWD_CATEGORIES,
  };
}
