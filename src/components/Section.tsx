import React from 'react'

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-5">
    <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
    {children}
  </div>
)

export default Section
