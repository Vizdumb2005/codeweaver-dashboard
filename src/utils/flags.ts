export interface FeatureFlags {
  enableNewOnboarding: boolean;
  enableIncidentManagement: boolean;
  enableRBAC: boolean;
}

const defaultFlags: FeatureFlags = {
  enableNewOnboarding: false,
  enableIncidentManagement: false,
  enableRBAC: false,
};

/**
 * Resolves current feature flags state, applying any URL parameters overrides (?flag_name=true/false)
 */
const getFlags = (): FeatureFlags => {
  const flags = { ...defaultFlags };

  if (typeof window === 'undefined') {
    return flags;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    (Object.keys(defaultFlags) as Array<keyof FeatureFlags>).forEach((key) => {
      const urlValue = params.get(`flag_${key}`);
      if (urlValue !== null) {
        flags[key] = urlValue === 'true';
      }
    });
  } catch (e) {
    console.error('[FeatureFlags] Failed to parse URL overrides:', e);
  }

  return flags;
};

export const featureFlags = getFlags();

export const isFeatureEnabled = (flag: keyof FeatureFlags): boolean => {
  return featureFlags[flag];
};
