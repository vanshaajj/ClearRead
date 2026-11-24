import { getRemoteConfig, fetchAndActivate, getValue } from "firebase/remote-config";
import { app, firebaseReady } from "./firebase";

export async function loadConfig() {
  const defaults = { charLimit: 8000, simplifyLevel: "simple", enableCloudCompare: true };
  if (!firebaseReady()) return defaults;
  try {
    const rc = getRemoteConfig(app);
    rc.settings.minimumFetchIntervalMillis = 60_000;
    rc.defaultConfig = {
      char_limit: defaults.charLimit,
      simplify_level: defaults.simplifyLevel,
      enable_cloud_compare: defaults.enableCloudCompare,
    };
    await fetchAndActivate(rc);
    return {
      charLimit: Number(getValue(rc, "char_limit").asNumber()) || defaults.charLimit,
      simplifyLevel: getValue(rc, "simplify_level").asString() || defaults.simplifyLevel,
      enableCloudCompare: getValue(rc, "enable_cloud_compare").asBoolean(),
    };
  } catch {
    return defaults;
  }
}
