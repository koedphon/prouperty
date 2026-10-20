// VIP Unlimited Access for the Owner
// kerdphon.posea@gmail.com is the ONLY account granted unlimited access, all others pay normally.
export const UNLIMITED_VIP_EMAIL = 'kerdphon.posea@gmail.com';

export const isUnlimitedVipUser = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().trim() === UNLIMITED_VIP_EMAIL.toLowerCase();
};
