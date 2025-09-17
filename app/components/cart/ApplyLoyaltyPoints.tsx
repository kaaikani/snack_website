import { useState } from 'react';
import { useFetcher } from '@remix-run/react';

interface ApplyLoyaltyPointsProps {
  availablePoints: number;
  orderId: string;
  pointsPerRupee: number;
}

type LoyaltyPointsFetcherData = {
  success?: boolean;
  error?: string;
};

export function ApplyLoyaltyPoints({
  availablePoints,
  orderId,
  pointsPerRupee,
}: ApplyLoyaltyPointsProps) {
  const [points, setPoints] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fetcher = useFetcher<LoyaltyPointsFetcherData>();

  const handleApply = () => {
    const amount = parseInt(points, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Enter a valid number of points.');
      return;
    }
    if (amount < pointsPerRupee) {
      setError(`Minimum ${pointsPerRupee} points needed to apply.`);
      return;
    }
    if (amount > availablePoints) {
      setError('You do not have enough points.');
      return;
    }
    setError(null);
    fetcher.submit(
      { action: 'applyLoyaltyPoints', amount, orderId },
      { method: 'post' },
    );
  };

  return (
    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">Loyalty Points</span>
        <span className="text-sm text-gray-700">
          Available: {availablePoints}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min={pointsPerRupee}
          max={availablePoints}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          className="border rounded px-2 py-1 w-24"
          placeholder="Points"
        />
        <button
          type="button"
          className="bg-white text-black border border-black px-3 py-1 rounded hover:bg-black hover:text-white"
          onClick={handleApply}
          disabled={fetcher.state === 'submitting'}
        >
          Apply
        </button>
        <span className="flex-1"></span>
        <p className="text-sm ml-auto">{pointsPerRupee} Points = 1 Rupee</p>
      </div>
      {error && <div className="text-red-600 text-xs mt-1">{error}</div>}
      {fetcher.data?.success && (
        <div className="text-green-600 text-xs mt-1">Points applied!</div>
      )}
      {fetcher.data?.error && (
        <div className="text-red-600 text-xs mt-1">{fetcher.data.error}</div>
      )}
    </div>
  );
}
