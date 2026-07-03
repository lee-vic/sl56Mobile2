export const MAINLAND_CHINA_MOBILE_PATTERN = /^1[3-9]\d{9}$/;

export function isMainlandChinaMobilePhone(value: string): boolean {
  return MAINLAND_CHINA_MOBILE_PATTERN.test((value || '').trim());
}
