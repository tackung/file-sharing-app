import React from "react";

interface Breadcrumb {
  label: string;
  path: string;
}

interface Props {
  breadcrumbs: Breadcrumb[];
  onNavigate: (path: string) => void;
}

const Breadcrumbs: React.FC<Props> = ({ breadcrumbs, onNavigate }) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center flex-wrap gap-2 text-sm text-slate-600">
        <span className="text-xs text-slate-500 mr-1">現在のフォルダ:</span>
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <div key={crumb.path} className="flex items-center gap-2">
              <button
                className={`transition-colors ${
                  isLast
                    ? "px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold"
                    : "text-blue-700 hover:text-blue-900"
                }`}
                onClick={() => onNavigate(crumb.path)}
              >
                {crumb.label}
              </button>
              {index < breadcrumbs.length - 1 && (
                <span className="text-slate-400">/</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Breadcrumbs;
