import React from 'react';

export default function Header() {
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-icon">CV</div>
        <div>
          <h1 className="brand-title">CV Evaluator</h1>
          <p className="brand-subtitle">AI-powered resume analysis &amp; evaluation</p>
        </div>
      </div>
    </header>
  );
}
