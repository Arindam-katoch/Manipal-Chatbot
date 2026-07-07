
"use client"; // Required in Next.js App Router for state and Recharts

import { useState } from 'react';
import { 
  ComposedChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer 
} from 'recharts';

// TypeScript interfaces
interface CompanyProps {
  companyName: string;
  placed: number;
  highest: number;
  average: number;
}

// Mock data for the graph
const mockGraphData = [
  { student: 'Student 1', package: 6.5 },
  { student: 'Student 2', package: 8.0 },
  { student: 'Student 3', package: 8.5 },
  { student: 'Student 4', package: 10.0 },
  { student: 'Student 5', package: 12.0 },
  { student: 'Student 6', package: 15.0 }, 
];

export default function CompanyRow({ 
  companyName, 
  placed, 
  highest, 
  average 
}: CompanyProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <tr 
        onClick={() => setIsOpen(true)} 
        className="cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-200"
      >
        <td className="p-4 font-semibold text-blue-600">{companyName}</td>
        <td className="p-4">{placed}</td>
        <td className="p-4">{highest} LPA</td>
        <td className="p-4">{average} LPA</td>
      </tr>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 relative">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-black">{companyName} - Packages</h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="text-gray-500 hover:text-red-500 font-bold text-xl px-2"
              >
                ✕
              </button>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={mockGraphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="student" hide />
                  <YAxis label={{ value: 'Package (LPA)', angle: -90, position: 'insideLeft', fill: '#000' }} />
                  <Tooltip formatter={(value: number) => [`${value} LPA`, 'Package']} />
                  
                  <Bar dataKey="package" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  
                  <ReferenceLine 
                    y={average} 
                    stroke="#ef4444" 
                    strokeDasharray="5 5" 
                    label={{ position: 'top', value: `Avg: ${average} LPA`, fill: '#ef4444' }} 
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
}
