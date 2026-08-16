import React from 'react';

export const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`} />
);

export const DashboardSkeleton = () => (
  <div className="space-y-8 w-full p-4">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Shimmer className="h-8 w-64" />
        <Shimmer className="h-4 w-40" />
      </div>
      <Shimmer className="h-10 w-32 rounded-2xl" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
          <Shimmer className="h-4 w-24" />
          <Shimmer className="h-8 w-16" />
          <Shimmer className="h-3 w-36" />
        </div>
      ))}
    </div>

    <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
      <Shimmer className="h-6 w-48" />
      <Shimmer className="h-40 w-full rounded-2xl" />
    </div>
  </div>
);

export const DoctorCardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
        <div className="flex items-center gap-4">
          <Shimmer className="w-14 h-14 rounded-2xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Shimmer className="h-5 w-3/4" />
            <Shimmer className="h-3 w-1/2" />
          </div>
        </div>
        <div className="space-y-2 pt-2">
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-5/6" />
        </div>
        <Shimmer className="h-10 w-full rounded-2xl mt-4" />
      </div>
    ))}
  </div>
);

export const RecordSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200 flex justify-between items-center">
        <div className="space-y-2 w-2/3">
          <Shimmer className="h-4 w-1/2" />
          <Shimmer className="h-3 w-3/4" />
        </div>
        <Shimmer className="h-8 w-24 rounded-xl" />
      </div>
    ))}
  </div>
);
