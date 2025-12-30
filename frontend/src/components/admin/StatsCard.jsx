/**
 * Stats Card Component.
 *
 * Displays a statistic with an icon and optional link for navigation.
 * Used in the admin dashboard.
 */

import { Link } from 'react-router-dom';

function StatsCard({ title, value, icon, color, link }) {
  const cardContent = (
    <div className={`card h-100 shadow-sm border-${color}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h6 className="card-subtitle mb-2 text-muted">{title}</h6>
            <h2 className={`card-title mb-0 text-${color}`}>{value}</h2>
          </div>
          <div>
            <i className={`bi ${icon} text-${color}`} style={{ fontSize: '2.5rem' }}></i>
          </div>
        </div>
      </div>
    </div>
  );

  // Wrap in Link if link prop is provided
  if (link) {
    return (
      <Link to={link} className="text-decoration-none">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default StatsCard;
