/**
 * Utility functions for formatting user names with pronouns
 */

/**
 * Formats a user's display name with pronouns if enabled
 * @param {Object} user - User object containing name, preferred_name, pronouns, show_pronouns
 * @param {Object} options - Options for formatting
 * @param {boolean} options.usePreferredName - Whether to use preferred_name (default: true)
 * @returns {JSX.Element} - Formatted name with pronouns
 */
export const formatNameWithPronouns = (user, options = {}) => {
  if (!user) return 'N/A';

  const { usePreferredName = true } = options;

  // Get the display name
  const displayName = usePreferredName
    ? (user.preferred_name || user.name)
    : user.name;

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
