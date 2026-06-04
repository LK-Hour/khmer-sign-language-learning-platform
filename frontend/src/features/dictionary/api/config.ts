/** When not `"false"`, dictionary uses local mock data (no backend route yet). */
export const DICT_USE_MOCK = process.env.NEXT_PUBLIC_DICT_USE_MOCK !== "false";

export { API_BASE_URL, resolveApiAssetUrl } from "@/features/finger-spelling/api/config";
