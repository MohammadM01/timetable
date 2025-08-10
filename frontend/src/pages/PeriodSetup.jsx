import React, { useState } from 'react';
import { savePeriods } from '../utils/api';

const PeriodSetup = () => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const [periods, setPeriods] = useState(
    days.map((day) => ({
      day,
      numPeriods: 0
    }))
  );
  
  const [error, setError] = useState('');

  const handlePeriodChange = (index, value) => {
    const newPeriods = [...periods];
    newPeriods[index].numPeriods = parseInt(value) || 0;
    setPeriods(newPeriods);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Corrected variable name
    try {
      // Data being sent as JSON
      await savePeriods(periods);
      alert('Periods saved successfully!');
    } catch (err) {
      setError('Failed to save periods');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-purple-600 mb-6 animate-pulse">Period Setup</h2>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg space-y-6">
        {periods.map((period, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{period.day}</label>
              <input
                type="number"
                value={period.numPeriods}
                onChange={(e) => handlePeriodChange(index, e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm animate-pulse"
                placeholder="e.g., 9"
                min="0"
                required
              />
            </div>
          </div>
        ))}
        {error && <p className="text-red-600 text-center">{error}</p>}
        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition duration-300 ease-in-out transform hover:scale-105 animate-bounce"
        >
          Save Periods
        </button>
      </form>
    </div>
  );
};

export default PeriodSetup;
