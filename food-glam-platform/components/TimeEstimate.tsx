// TimeEstimate.tsx

import React from 'react';
import { Clock } from 'lucide-react';

interface TimeEstimateProps {
  prepTime: number;
  cookTime: number;
}

const TimeEstimate: React.FC<TimeEstimateProps> = ({ prepTime, cookTime }) => {
  const total_time = prepTime + cookTime;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Clock size={16} />
      <div>
        <span style={{ fontWeight: '500' }}>Total Time:</span>
        <span>{total_time} min</span>
      </div>
      <div>
        <span>Prep:</span>
        <span>{prepTime} min</span>
      </div>
      <div>
        <span>Cook:</span>
        <span>{cookTime} min</span>
      </div>
    </div>
  );
};

export default TimeEstimate