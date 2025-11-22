/**
 * Date Range Filter Component
 * Date picker for filtering jobs by scheduled time
 * Requirement: 18.3
 */

'use client';

interface DateRangeFilterProps {
  dateFrom?: string;
  dateTo?: string;
  onChange: (dateFrom?: string, dateTo?: string) => void;
  disabled?: boolean;
}

export function DateRangeFilter({ dateFrom, dateTo, onChange, disabled }: DateRangeFilterProps) {
  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value || undefined, dateTo);
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(dateFrom, e.target.value || undefined);
  };

  const handleClear = () => {
    onChange(undefined, undefined);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-sm font-medium text-gray-700">Date Range</label>
        {(dateFrom || dateTo) && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Clear
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <input
            type="date"
            value={dateFrom || ''}
            onChange={handleFromChange}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="From"
          />
        </div>
        <div>
          <input
            type="date"
            value={dateTo || ''}
            onChange={handleToChange}
            disabled={disabled}
            min={dateFrom}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder="To"
          />
        </div>
      </div>
    </div>
  );
}
