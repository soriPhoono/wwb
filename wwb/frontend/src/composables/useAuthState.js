import { ref } from "vue";

// Shared singleton auth state
export const user = ref(null);
export const authLoading = ref(true);
