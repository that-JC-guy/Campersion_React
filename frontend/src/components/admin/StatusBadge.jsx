/**
 * Status Badge Component.
 *
 * Displays a colored badge for different status types.
 * Supports user status, event status, and association status.
 */

function StatusBadge({ status, type }) {
  const getBadgeClass = () => {
    if (type === 'user') {
      return status === true || status === 'active' ? 'bg-success' : 'bg-danger';
    }

    if (type === 'event') {
      switch (status) {
        case 'pending':
          return 'bg-warning text-dark';
        case 'approved':
          return 'bg-success';
        case 'rejected':
          return 'bg-danger';
        case 'cancelled':
          return 'bg-secondary';
        default:
          return 'bg-secondary';
      }
    }

    if (type === 'association') {
      switch (status) {
        case 'pending':
          return 'bg-warning text-dark';
        case 'approved':
          return 'bg-success';
        case 'rejected':
          return 'bg-danger';
        default:
          return 'bg-secondary';
      }
    }

    return 'bg-secondary';
  };

  const getStatusText = () => {
    if (type === 'user') {
      return status === true || status === 'active' ? 'Active' : 'Suspended';
    }

    // For event and association, capitalize the status
    if (typeof status === 'string') {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }

    return String(status);
  };

  return (
    <span className={`badge ${getBadgeClass()}`}>
      {getStatusText()}
    </span>
  );
}

export default StatusBadge;
