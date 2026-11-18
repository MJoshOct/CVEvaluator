import React from 'react';

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export function AdminOverviewIcon({ width = 18, height = 18 }) {
  return <svg {...svgProps} width={width} height={height}><rect x="3.2" y="3.2" width="7.1" height="7.1" rx="1.8" fill="currentColor" opacity=".16"/><rect x="13.7" y="3.2" width="7.1" height="4.3" rx="1.5"/><rect x="13.7" y="10.1" width="7.1" height="10.7" rx="1.8"/><rect x="3.2" y="13.3" width="7.1" height="7.5" rx="1.8"/></svg>;
}

export function AdminEvaluationsIcon({ width = 18, height = 18 }) {
  return <svg {...svgProps} width={width} height={height}><path d="M7 3.7h7.4l3.8 3.8v12.1a1.7 1.7 0 0 1-1.7 1.7H7a2 2 0 0 1-2-2V5.7a2 2 0 0 1 2-2Z"/><path d="M14.2 3.9v4h4M8.2 12h7.6M8.2 15.6h7.6M8.2 8.7h2.6"/><circle cx="17.8" cy="18" r="3.1" fill="#fff"/><path d="m16.6 18 1 1 1.7-2"/></svg>;
}

export function AdminUsersIcon({ width = 18, height = 18 }) {
  return <svg {...svgProps} width={width} height={height}><circle cx="9" cy="8" r="3.1" fill="currentColor" opacity=".13"/><path d="M3.6 19.3v-1.2a5.4 5.4 0 0 1 10.8 0v1.2a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1Z"/><path d="M15.2 5.2a3.1 3.1 0 0 1 0 5.9M17 13.6a4.5 4.5 0 0 1 3.4 4.4v1.3a1 1 0 0 1-1 1h-2.1"/></svg>;
}

export function AdminServicesIcon({ width = 18, height = 18 }) {
  return <svg {...svgProps} width={width} height={height}><path d="M12 2.8 19.3 6v5.1c0 4.8-2.9 8.1-7.3 10.1-4.4-2-7.3-5.3-7.3-10.1V6L12 2.8Z" fill="currentColor" opacity=".12"/><path d="M12 2.8 19.3 6v5.1c0 4.8-2.9 8.1-7.3 10.1-4.4-2-7.3-5.3-7.3-10.1V6L12 2.8Z"/><path d="m8.9 11.7 2 2 4.3-4.4M12 6.5v1.2"/></svg>;
}

export function AdminConsoleIcon({ width = 18, height = 18 }) {
  return <svg {...svgProps} width={width} height={height}><path d="M12 2.7 19.8 6v5.3c0 4.9-3 8.1-7.8 10-4.8-1.9-7.8-5.1-7.8-10V6L12 2.7Z" fill="currentColor" opacity=".14"/><path d="M12 2.7 19.8 6v5.3c0 4.9-3 8.1-7.8 10-4.8-1.9-7.8-5.1-7.8-10V6L12 2.7Z"/><path d="M8.6 14.8V9.4l3.4-2 3.4 2v5.4M8.6 11h6.8M12 7.6v7.2"/></svg>;
}

