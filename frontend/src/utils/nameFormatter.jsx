/**
 * Utility functions for formatting user names with pronouns
 */

/**
 * Formats a user's display name with pronouns if enabled
 * @param {Object} user - User object containing name, preferred_name, pronouns, show_pronouns, show_full_name
 * @param {Object} options - Options for formatting
 * @param {boolean} options.usePreferredName - Whether to use preferred_name (default: true, overridden by show_full_name)
 * @returns {JSX.Element} - Formatted name with pronouns
 */
export const formatNameWithPronouns = (user, options = {}) => {
  if (!user) return 'N/A';

  const { usePreferredName = true } = options;

  // Get the display name
  // Priority:
  // 1. If user.show_full_name is true, always use full name
  // 2. Otherwise, use preferred_name if available
  // 3. Fallback to full name
  let displayName;
  if (user.show_full_name) {
    displayName = user.name;
  } else if (usePreferredName && user.preferred_name) {
    displayName = user.preferred_name;
  } else {
    displayName = user.name;
  }

  // Check if we should show pronouns
  const shouldShowPronouns = user.show_pronouns && user.pronouns;

  if (shouldShowPronouns) {
    return (
      <>
        {displayName} <small className="text-muted">({user.pronouns})</small>
      </>
    );
  }

  return displayName;
};

/**
 * Formats a member's display name with pronouns (handles member.user structure)
 * @param {Object} member - Member object containing user object
 * @param {Object} options - Options for formatting
 * @returns {JSX.Element} - Formatted name with pronouns
 */
export const formatMemberNameWithPronouns = (member, options = {}) => {
  const user = member?.user || member;
  return formatNameWithPronouns(user, options);
};
