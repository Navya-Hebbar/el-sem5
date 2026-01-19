import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

const ClassificationResultsViz = () => {
  const [activeChart, setActiveChart] = useState('metrics');

  const data = [
    { class: 'back', precision: 1.00, recall: 1.00, f1: 1.00, support: 359 },
    { class: 'buffer_overflow', precision: 0.34, recall: 0.55, f1: 0.42, support: 20 },
    { class: 'ftp_write', precision: 0.02, recall: 0.67, f1: 0.04, support: 3 },
    { class: 'guess_passwd', precision: 0.99, recall: 0.27, f1: 0.42, support: 1231 },
    { class: 'imap', precision: 0.00, recall: 0.00, f1: 0.00, support: 1 },
    { class: 'ipsweep', precision: 0.99, recall: 0.98, f1: 0.99, support: 141 },
    { class: 'land', precision: 1.00, recall: 0.43, f1: 0.60, support: 7 },
    { class: 'loadmodule', precision: 0.00, recall: 0.00, f1: 0.00, support: 2 },
    { class: 'multihop', precision: 0.00, recall: 0.00, f1: 0.00, support: 18 },
    { class: 'neptune', precision: 1.00, recall: 1.00, f1: 1.00, support: 4657 },
    { class: 'nmap', precision: 1.00, recall: 1.00, f1: 1.00, support: 73 },
    { class: 'normal', precision: 0.87, recall: 0.97, f1: 0.92, support: 9711 },
    { class: 'perl', precision: 0.50, recall: 0.50, f1: 0.50, support: 2 },
    { class: 'phf', precision: 1.00, recall: 0.50, f1: 0.67, support: 2 },
    { class: 'pod', precision: 0.69, recall: 0.88, f1: 0.77, support: 41 },
    { class: 'portsweep', precision: 0.79, recall: 0.95, f1: 0.86, support: 157 },
    { class: 'rootkit', precision: 0.01, recall: 0.08, f1: 0.01, support: 13 },
    { class: 'satan', precision: 0.82, recall: 1.00, f1: 0.90, support: 735 },
    { class: 'smurf', precision: 1.00, recall: 1.00, f1: 1.00, support: 665 },
    { class: 'teardrop', precision: 0.24, recall: 1.00, f1: 0.39, support: 12 },
    { class: 'warezmaster', precision: 0.89, recall: 0.26, f1: 0.41, support: 944 }
  ];

  const overallMetrics = [
    { metric: 'Accuracy', value: 0.89 },
    { metric: 'Macro Avg Precision', value: 0.63 },
    { metric: 'Macro Avg Recall', value: 0.62 },
    { metric: 'Macro Avg F1', value: 0.57 },
    { metric: 'Weighted Avg Precision', value: 0.91 },
    { metric: 'Weighted Avg Recall', value: 0.89 },
    { metric: 'Weighted Avg F1', value: 0.88 }
  ];

  // Sort by support for better visualization
  const sortedData = [...data].sort((a, b) => b.support - a.support);

  // Top 10 classes by support
  const top10Data = sortedData.slice(0, 10);

  // Precision-Recall scatter
  const prScatter = data.map(d => ({
    ...d,
    x: d.recall,
    y: d.precision
  }));

  const getColor = (value) => {
    if (value >= 0.8) return '#10b981';
    if (value >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
          <p className="font-semibold">{data.class}</p>
          <p className="text-sm">Precision: {data.precision.toFixed(2)}</p>
          <p className="text-sm">Recall: {data.recall.toFixed(2)}</p>
          <p className="text-sm">F1-Score: {data.f1.toFixed(2)}</p>
          <p className="text-sm">Support: {data.support}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-screen bg-gray-50 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">Network Intrusion Detection Classification Results</h1>
        <p className="text-gray-600 mb-6">Model Performance Metrics Visualization (Total Samples: 18,794)</p>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveChart('metrics')}
            className={`px-4 py-2 rounded ${activeChart === 'metrics' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            F1-Score by Class
          </button>
          <button
            onClick={() => setActiveChart('precision-recall')}
            className={`px-4 py-2 rounded ${activeChart === 'precision-recall' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Precision vs Recall
          </button>
          <button
            onClick={() => setActiveChart('top10')}
            className={`px-4 py-2 rounded ${activeChart === 'top10' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Top 10 Classes
          </button>
          <button
            onClick={() => setActiveChart('overall')}
            className={`px-4 py-2 rounded ${activeChart === 'overall' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Overall Metrics
          </button>
          <button
            onClick={() => setActiveChart('scatter')}
            className={`px-4 py-2 rounded ${activeChart === 'scatter' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            Precision-Recall Scatter
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeChart === 'metrics' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">F1-Score by Attack Class</h2>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" angle={-45} textAnchor="end" height={120} interval={0} style={{ fontSize: '11px' }} />
                  <YAxis label={{ value: 'F1-Score', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="f1" name="F1-Score">
                    {sortedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(entry.f1)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'precision-recall' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Precision vs Recall Comparison</h2>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" angle={-45} textAnchor="end" height={120} interval={0} style={{ fontSize: '11px' }} />
                  <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="precision" fill="#3b82f6" name="Precision" />
                  <Bar dataKey="recall" fill="#10b981" name="Recall" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'top10' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Performance Metrics for Top 10 Classes by Support</h2>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={top10Data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="class" angle={-45} textAnchor="end" height={100} style={{ fontSize: '12px' }} />
                  <YAxis label={{ value: 'Score', angle: -90, position: 'insideLeft' }} domain={[0, 1]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="precision" fill="#3b82f6" name="Precision" />
                  <Bar dataKey="recall" fill="#10b981" name="Recall" />
                  <Bar dataKey="f1" fill="#8b5cf6" name="F1-Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'overall' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Overall Model Performance Metrics</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={overallMetrics} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" angle={-30} textAnchor="end" height={100} style={{ fontSize: '12px' }} />
                  <YAxis domain={[0, 1]} label={{ value: 'Score', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1">
                    {overallMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded">
                  <p className="text-sm text-gray-600">Overall Accuracy</p>
                  <p className="text-3xl font-bold text-blue-600">89%</p>
                </div>
                <div className="p-4 bg-green-50 rounded">
                  <p className="text-sm text-gray-600">Weighted Avg F1-Score</p>
                  <p className="text-3xl font-bold text-green-600">88%</p>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'scatter' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Precision-Recall Trade-off Analysis</h2>
              <ResponsiveContainer width="100%" height={500}>
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name="Recall" domain={[0, 1]} label={{ value: 'Recall', position: 'insideBottom', offset: -10 }} />
                  <YAxis type="number" dataKey="y" name="Precision" domain={[0, 1]} label={{ value: 'Precision', angle: -90, position: 'insideLeft' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter name="Classes" data={prScatter}>
                    {prScatter.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColor(entry.f1)} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-4 flex gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">F1 ≥ 0.8 (Excellent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm">0.5 ≤ F1 &lt; 0.8 (Moderate)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">F1 &lt; 0.5 (Poor)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Key Observations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 border-l-4 border-green-500">
              <h3 className="font-semibold text-green-800 mb-2">High Performance Classes</h3>
              <p className="text-sm text-gray-700">Perfect F1-scores (1.00) achieved for: back, neptune, nmap, and smurf attacks</p>
            </div>
            <div className="p-4 bg-red-50 border-l-4 border-red-500">
              <h3 className="font-semibold text-red-800 mb-2">Low Performance Classes</h3>
              <p className="text-sm text-gray-700">Poor detection for rare attacks: imap, loadmodule, multihop, rootkit, and ftp_write</p>
            </div>
            <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500">
              <h3 className="font-semibold text-yellow-800 mb-2">Class Imbalance Impact</h3>
              <p className="text-sm text-gray-700">Classes with low support (&lt;20 samples) show inconsistent performance</p>
            </div>
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-800 mb-2">Precision-Recall Trade-offs</h3>
              <p className="text-sm text-gray-700">Some classes show high precision but low recall (guess_passwd, warezmaster)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassificationResultsViz;