/**
 * Engineer Performance Comparison Component
 * Displays and compares performance metrics across engineers
 * Requirements: 10.4
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

interface Engineer {
  id: string;
  name: string;
  availability_status: string;
  total_jobs_completed: number;
  average_rating: number;
  success_rate: number;
}

interface EngineerPerformance {
  engineer_id: string;
  engineer_name: string;
  performance_summary: {
    total_jobs_completed: number;
    average_rating: number;
    success_rate: number;
    revenue_generated: number;
  };
}

interface EngineerPerformanceComparisonProps {
  engineers: Engineer[];
  loading?: boolean;
  agencyId?: string;
}

type SortField = 'name' | 'jobs' | 'rating' | 'success_rate';
type SortOrder = 'asc' | 'desc';

export function EngineerPerformanceComparison({
  engineers = [],
  loading = false,
}: EngineerPerformanceComparisonProps) {
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  // Fetch detailed performance for selected engineers
  const { data: detailedPerformance } = useQuery({
    queryKey: ['engineer-performance-detailed', selectedEngineers],
    queryFn: async () => {
      const promises = selectedEngineers.map(async (engineerId) => {
        const response = await fetch(`/api/engineers/${engineerId}/performance?period=month`);
        if (!response.ok) return null;
        return response.json();
      });
      const results = await Promise.all(promises);
      return results.filter(Boolean);
    },
    enabled: selectedEngineers.length > 0 && viewMode === 'chart',
  });

  // Sort engineers
  const sortedEngineers = useMemo(() => {
    const sorted = [...engineers].sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'jobs':
          aValue = a.total_jobs_completed || 0;
          bValue = b.total_jobs_completed || 0;
          break;
        case 'rating':
          aValue = a.average_rating || 0;
          bValue = b.average_rating || 0;
          break;
        case 'success_rate':
          aValue = a.success_rate || 0;
          bValue = b.success_rate || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [engineers, sortField, sortOrder]);

  // Prepare comparison chart data
  const comparisonChartData = useMemo(() => {
    return sortedEngineers.slice(0, 10).map(engineer => ({
      name: engineer.name.split(' ')[0], // First name only for chart
      'Jobs Completed': engineer.total_jobs_completed || 0,
      'Avg Rating': (engineer.average_rating || 0) * 20, // Scale to 100 for better visualization
      'Success Rate': engineer.success_rate || 0,
    }));
  }, [sortedEngineers]);

  // Prepare radar chart data for selected engineers
  const radarChartData = useMemo(() => {
    if (!detailedPerformance || detailedPerformance.length === 0) return [];

    const metrics = ['Jobs', 'Rating', 'Success Rate', 'Revenue'];
    
    return metrics.map(metric => {
      const dataPoint: Record<string, string | number> = { metric };
      
      detailedPerformance.forEach((perf: EngineerPerformance) => {
        const engineerName = perf.engineer_name.split(' ')[0];
        
        switch (metric) {
          case 'Jobs':
            dataPoint[engineerName] = perf.performance_summary.total_jobs_completed;
            break;
          case 'Rating':
            dataPoint[engineerName] = perf.performance_summary.average_rating * 20; // Scale to 100
            break;
          case 'Success Rate':
            dataPoint[engineerName] = perf.performance_summary.success_rate;
            break;
          case 'Revenue':
            dataPoint[engineerName] = Math.min(perf.performance_summary.revenue_generated / 1000, 100); // Scale down
            break;
        }
      });
      
      return dataPoint;
    });
  }, [detailedPerformance]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const toggleEngineerSelection = (engineerId: string) => {
    setSelectedEngineers(prev => {
      if (prev.includes(engineerId)) {
        return prev.filter(id => id !== engineerId);
      } else if (prev.length < 5) {
        return [...prev, engineerId];
      }
      return prev;
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (engineers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500">No engineers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Engineer Performance Comparison</h2>
            <p className="text-sm text-gray-500 mt-1">
              Compare performance metrics across your engineering team
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                viewMode === 'chart'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Chart View
            </button>
          </div>
        </div>

        {viewMode === 'chart' && selectedEngineers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              {selectedEngineers.length} engineer(s) selected for comparison. 
              Select up to 5 engineers from the table below.
            </p>
          </div>
        )}
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      disabled
                    />
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    Engineer {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('jobs')}
                  >
                    Jobs Completed {sortField === 'jobs' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('rating')}
                  >
                    Avg Rating {sortField === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('success_rate')}
                  >
                    Success Rate {sortField === 'success_rate' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEngineers.map((engineer) => (
                  <tr key={engineer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEngineers.includes(engineer.id)}
                        onChange={() => toggleEngineerSelection(engineer.id)}
                        disabled={!selectedEngineers.includes(engineer.id) && selectedEngineers.length >= 5}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{engineer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          engineer.availability_status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : engineer.availability_status === 'on_job'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {engineer.availability_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {engineer.total_jobs_completed || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(engineer.average_rating || 0).toFixed(2)} ⭐
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${engineer.success_rate || 0}%` }}
                          ></div>
                        </div>
                        <span>{(engineer.success_rate || 0).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart View */}
      {viewMode === 'chart' && (
        <div className="space-y-6">
          {/* Overall Comparison Bar Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top 10 Engineers - Performance Overview
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={comparisonChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="Jobs Completed" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Avg Rating" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Success Rate" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Detailed Comparison Radar Chart */}
          {selectedEngineers.length > 0 && detailedPerformance && detailedPerformance.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selected Engineers - Detailed Comparison
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="metric" stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <PolarRadiusAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  {detailedPerformance.map((perf: EngineerPerformance, index: number) => (
                    <Radar
                      key={perf.engineer_id}
                      name={perf.engineer_name.split(' ')[0]}
                      dataKey={perf.engineer_name.split(' ')[0]}
                      stroke={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]}
                      fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]}
                      fillOpacity={0.3}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
