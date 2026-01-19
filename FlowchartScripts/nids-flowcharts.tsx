import React, { useState } from 'react';

const FlowchartDiagrams = () => {
  const [activeChart, setActiveChart] = useState('overall');

  const charts = [
    { id: 'overall', name: 'Overall Methodology' },
    { id: 'augmentation', name: 'Data Augmentation Pipeline' },
    { id: 'fusion', name: 'Hybrid Fusion Architecture' },
    { id: 'training', name: 'Model Training Workflow' },
    { id: 'prediction', name: 'Prediction Flow (MLAR)' }
  ];

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">NIDS Methodology Flowcharts</h1>
        <p className="text-gray-600 mb-6">Comprehensive visual representation of experimental procedures</p>
        
        <div className="flex gap-2 mb-6 flex-wrap">
          {charts.map(chart => (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`px-4 py-2 rounded text-sm ${
                activeChart === chart.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {chart.name}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {activeChart === 'overall' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Overall Methodology Flowchart</h2>
              
              <div className="flex flex-col items-center space-y-4">
                {/* Phase 1 */}
                <div className="w-full max-w-3xl">
                  <div className="bg-blue-100 border-2 border-blue-500 rounded-lg p-4">
                    <div className="font-bold text-lg text-blue-900">PHASE 1: DATA PREPROCESSING</div>
                  </div>
                  <div className="flex justify-center my-2">
                    <div className="w-1 h-8 bg-gray-400"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border-2 border-blue-300 rounded p-3 text-center">
                      <div className="font-semibold text-sm">Load NSL-KDD</div>
                      <div className="text-xs text-gray-600 mt-1">125,973 samples</div>
                      <div className="text-xs text-gray-600">23 classes</div>
                    </div>
                    <div className="bg-white border-2 border-blue-300 rounded p-3 text-center">
                      <div className="font-semibold text-sm">Analyze Imbalance</div>
                      <div className="text-xs text-gray-600 mt-1">Gini: 0.8</div>
                      <div className="text-xs text-gray-600">1-10 samples/class</div>
                    </div>
                    <div className="bg-white border-2 border-blue-300 rounded p-3 text-center">
                      <div className="font-semibold text-sm">Augmentation</div>
                      <div className="text-xs text-gray-600 mt-1">SMOTE-NC</div>
                      <div className="text-xs text-gray-600">→200k samples</div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="text-2xl text-gray-400">↓</div>
                </div>

                {/* Phase 2 */}
                <div className="w-full max-w-3xl">
                  <div className="bg-green-100 border-2 border-green-500 rounded-lg p-4">
                    <div className="font-bold text-lg text-green-900">PHASE 2: BASELINE DEVELOPMENT</div>
                  </div>
                  <div className="flex justify-center my-2">
                    <div className="w-1 h-8 bg-gray-400"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border-2 border-green-300 rounded p-3 text-center">
                      <div className="font-semibold text-sm">Traditional ML</div>
                      <div className="text-xs text-gray-600 mt-1">XGBoost</div>
                      <div className="text-xs text-gray-600">RandomForest</div>
                      <div className="text-xs text-gray-600">LightGBM</div>
                    </div>
                    <div className="bg-white border-2 border-green-300 rounded p-3 text-center">
                      <div className="font-semibold text-sm">Deep Learning</div>
                      <div className="text-xs text-gray-600 mt-1">RobustMLP</div>
                      <div className="text-xs text-gray-600">TabTransformer</div>
                      <div className="text-xs text-gray-600">HCAN</div>
                    </div>
                    <div className="bg-white border-2 border-green-300 rounded p-3 text-center">
                      <div className="font-semibold text-sm">Evaluation</div>
                      <div className="text-xs text-gray-600 mt-1">Best: RF 85.82%</div>
                      <div className="text-xs text-gray-600">Macro F1: 0.49</div>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="text-2xl text-gray-400">↓</div>
                </div>

                {/* Phase 3 */}
                <div className="w-full max-w-3xl">
                  <div className="bg-purple-100 border-2 border-purple-500 rounded-lg p-4">
                    <div className="font-bold text-lg text-purple-900">PHASE 3: HYBRID FUSION ARCHITECTURES</div>
                  </div>
                  <div className="flex justify-center my-2">
                    <div className="w-1 h-8 bg-gray-400"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white border-2 border-purple-300 rounded p-3">
                      <div className="font-semibold text-sm mb-2">Train Specialist</div>
                      <div className="text-xs text-gray-600">• Neural Network (MLAR/LSO)</div>
                      <div className="text-xs text-gray-600">• Center Loss</div>
                      <div className="text-xs text-gray-600">• Extreme class weights (40x)</div>
                      <div className="text-xs text-gray-600">• Logit sharpening</div>
                    </div>
                    <div className="bg-white border-2 border-purple-300 rounded p-3">
                      <div className="font-semibold text-sm mb-2">Train Anchor</div>
                      <div className="text-xs text-gray-600">• XGBoost (400 trees)</div>
                      <div className="text-xs text-gray-600">• Histogram method</div>
                      <div className="text-xs text-gray-600">• Depth: 10</div>
                      <div className="text-xs text-gray-600">• Full dataset training</div>
                    </div>
                  </div>
                  <div className="flex justify-center my-2">
                    <div className="w-1 h-8 bg-gray-400"></div>
                  </div>
                  <div className="bg-white border-2 border-purple-300 rounded p-4 text-center">
                    <div className="font-semibold">Design Fusion Logic</div>
                    <div className="text-xs text-gray-600 mt-2">Heuristic Gates + Confidence Thresholds + Context Switching</div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="text-2xl text-gray-400">↓</div>
                </div>

                {/* Phase 4 */}
                <div className="w-full max-w-3xl">
                  <div className="bg-orange-100 border-2 border-orange-500 rounded-lg p-4">
                    <div className="font-bold text-lg text-orange-900">PHASE 4: EVALUATION & SELECTION</div>
                  </div>
                  <div className="flex justify-center my-2">
                    <div className="w-1 h-8 bg-gray-400"></div>
                  </div>
                  <div className="bg-white border-2 border-orange-300 rounded p-4">
                    <div className="font-semibold text-center mb-3">19 Fusion Models Evaluated</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Metrics Tracked:</div>
                        <div>• Accuracy, Macro F1</div>
                        <div>• Precision/Recall per class</div>
                        <div>• Weighted averages</div>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <div className="font-semibold">Best Model:</div>
                        <div>• MLAR-Specialist + XGBoost</div>
                        <div>• Accuracy: 89%</div>
                        <div>• Macro F1: 0.57</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Output */}
                <div className="flex items-center justify-center">
                  <div className="text-2xl text-gray-400">↓</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 text-center max-w-2xl">
                  <div className="text-xl font-bold">PRODUCTION-READY NIDS</div>
                  <div className="text-sm mt-2">21/23 Attack Classes Detected • Real-time Inference • Frontend Integration</div>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'augmentation' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Data Augmentation Pipeline</h2>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 max-w-2xl">
                  <div className="font-bold text-center">PROBLEM: Severe Class Imbalance</div>
                  <div className="text-sm text-center mt-2">Normal: 67,000 | neptune: 4,657 | buffer_overflow: 20 | imap: 1</div>
                  <div className="text-center text-xs text-gray-600 mt-1">Gini Coefficient: 0.8 (highly imbalanced)</div>
                </div>

                <div className="text-2xl text-gray-400">↓</div>

                {/* Three paths */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-5xl">
                  {/* ADASYN */}
                  <div className="border-2 border-blue-300 rounded-lg p-4">
                    <div className="bg-blue-500 text-white rounded p-2 text-center font-bold mb-3">ADASYN</div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 1: Bootstrap</div>
                        <div className="text-xs">Min 5 samples/class</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 2: ADASYN</div>
                        <div className="text-xs">k_neighbors = 3</div>
                        <div className="text-xs">Density-based sampling</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 3: Validate</div>
                        <div className="text-xs">TSTR with RF</div>
                      </div>
                      <div className="bg-blue-100 p-2 rounded mt-3">
                        <div className="text-xs font-semibold">Result:</div>
                        <div className="text-xs">⏱️ Fast (2 min)</div>
                        <div className="text-xs">📊 Quality: Good</div>
                        <div className="text-xs">🎯 Macro F1: 0.33</div>
                      </div>
                    </div>
                  </div>

                  {/* SMOTE-NC */}
                  <div className="border-2 border-green-400 rounded-lg p-4 shadow-lg">
                    <div className="bg-green-500 text-white rounded p-2 text-center font-bold mb-3">SMOTE-NC ⭐</div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 1: Analyze</div>
                        <div className="text-xs">Separate categorical/numerical</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 2: Adaptive K</div>
                        <div className="text-xs">k = 1-5 (class size based)</div>
                        <div className="text-xs">Mixed-type interpolation</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 3: Validate</div>
                        <div className="text-xs">Correlation + PCA check</div>
                      </div>
                      <div className="bg-green-100 p-2 rounded mt-3">
                        <div className="text-xs font-semibold">Result: SELECTED ✅</div>
                        <div className="text-xs">⏱️ Fast (2 min)</div>
                        <div className="text-xs">📊 Quality: Excellent</div>
                        <div className="text-xs">🎯 Macro F1: 0.49</div>
                      </div>
                    </div>
                  </div>

                  {/* CTGAN */}
                  <div className="border-2 border-purple-300 rounded-lg p-4">
                    <div className="bg-purple-500 text-white rounded p-2 text-center font-bold mb-3">CTGAN Hybrid</div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 1: Bootstrap</div>
                        <div className="text-xs">Min 30 samples/class</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 2: CTGAN</div>
                        <div className="text-xs">300 epochs, 50k synthetic</div>
                        <div className="text-xs">Deep generative learning</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="font-semibold">Step 3: SMOTE</div>
                        <div className="text-xs">On GAN-generated data</div>
                      </div>
                      <div className="bg-purple-100 p-2 rounded mt-3">
                        <div className="text-xs font-semibold">Result:</div>
                        <div className="text-xs">⏱️ Slow (80 min)</div>
                        <div className="text-xs">📊 Quality: Best</div>
                        <div className="text-xs">🎯 Macro F1: 0.51 (+4%)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-2xl text-gray-400">↓</div>

                <div className="bg-green-50 border-2 border-green-400 rounded-lg p-6 max-w-3xl">
                  <div className="font-bold text-center text-lg mb-3">OUTCOME: SMOTE-NC Selected for Production</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold">Before Augmentation:</div>
                      <div className="text-xs">• Total: 125,973 samples</div>
                      <div className="text-xs">• Gini: 0.8</div>
                      <div className="text-xs">• Rare classes: 1-10 samples</div>
                    </div>
                    <div>
                      <div className="font-semibold">After Augmentation:</div>
                      <div className="text-xs">• Total: ~200,000 samples (+60%)</div>
                      <div className="text-xs">• Gini: 0.3-0.5 (improved)</div>
                      <div className="text-xs">• Rare classes: 100-1000 samples</div>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-white rounded">
                    <div className="text-xs text-center font-semibold">Impact: Macro Recall +5.4% (0.56 → 0.59)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'fusion' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Hybrid Fusion Architecture (MLAR-Specialist)</h2>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-blue-50 border-2 border-blue-400 rounded p-3 max-w-lg text-center">
                  <div className="font-bold">Network Flow Features (41 dimensions)</div>
                  <div className="text-xs text-gray-600">protocol_type, service, flag, src_bytes, dst_bytes, ...</div>
                </div>

                <div className="text-2xl text-gray-400">↓</div>

                {/* Dual Track */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-4xl">
                  {/* Specialist Track */}
                  <div className="border-2 border-purple-400 rounded-lg p-4 bg-purple-50">
                    <div className="bg-purple-600 text-white rounded p-2 text-center font-bold mb-3">
                      SPECIALIST (Neural Network)
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-2 rounded">
                        <div className="font-semibold">MLAR-Net Architecture</div>
                        <div className="text-xs mt-1">FC(512) → SiLU → BatchNorm</div>
                        <div className="text-xs">FC(256) → SiLU → BatchNorm</div>
                        <div className="text-xs">FC(128) → SiLU → BatchNorm</div>
                        <div className="text-xs">FC(23) → Softmax</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="font-semibold">Center Loss</div>
                        <div className="text-xs mt-1">L = L_CE + λ·Σ||x - c_y||²</div>
                        <div className="text-xs">Forces feature clustering</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="font-semibold">Extreme Weights</div>
                        <div className="text-xs mt-1">U2R classes: 40.0x</div>
                        <div className="text-xs">R2L classes: 20.0x</div>
                        <div className="text-xs">Normal: 1.0x</div>
                      </div>
                      <div className="bg-purple-200 p-2 rounded">
                        <div className="text-xs font-bold">Output: 23-class probabilities</div>
                        <div className="text-xs">Sensitive to rare attacks</div>
                      </div>
                    </div>
                  </div>

                  {/* Anchor Track */}
                  <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
                    <div className="bg-green-600 text-white rounded p-2 text-center font-bold mb-3">
                      ANCHOR (XGBoost)
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="bg-white p-2 rounded">
                        <div className="font-semibold">XGBoost Configuration</div>
                        <div className="text-xs mt-1">n_estimators: 400</div>
                        <div className="text-xs">max_depth: 10</div>
                        <div className="text-xs">learning_rate: 0.1</div>
                        <div className="text-xs">tree_method: hist</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="font-semibold">Training</div>
                        <div className="text-xs mt-1">Full dataset (all classes)</div>
                        <div className="text-xs">Standard class weights</div>
                        <div className="text-xs">Optimized for stability</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="font-semibold">Strength</div>
                        <div className="text-xs mt-1">Perfect DoS detection (1.00 F1)</div>
                        <div className="text-xs">Stable on high-volume classes</div>
                        <div className="text-xs">Fast inference</div>
                      </div>
                      <div className="bg-green-200 p-2 rounded">
                        <div className="text-xs font-bold">Output: 23-class probabilities</div>
                        <div className="text-xs">Optimized for accuracy</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-2xl text-gray-400">↓</div>

                {/* Fusion Engine */}
                <div className="border-2 border-orange-400 rounded-lg p-6 bg-orange-50 max-w-4xl w-full">
                  <div className="bg-orange-600 text-white rounded p-3 text-center font-bold mb-4">
                    DYNAMIC BAYESIAN FUSION ENGINE
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3 border-l-4 border-red-500">
                      <div className="font-bold text-sm">Rule 1: Hard Class Override</div>
                      <div className="text-xs mt-1 font-mono bg-gray-100 p-2 rounded">
                        IF specialist_confidence['rare_class'] &gt; 0.35:<br/>
                        &nbsp;&nbsp;RETURN specialist_prediction
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Priority: buffer_overflow, rootkit, ftp_write, warezmaster</div>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-blue-500">
                      <div className="font-bold text-sm">Rule 2: Anchor Confidence Gate</div>
                      <div className="text-xs mt-1 font-mono bg-gray-100 p-2 rounded">
                        IF anchor_confidence &gt; 0.85 AND class != 'normal':<br/>
                        &nbsp;&nbsp;RETURN anchor_prediction
                      </div>
                      <div className="text-xs text-gray-600 mt-1">Trust anchor for high-volume DoS/Probe attacks</div>
                    </div>

                    <div className="bg-white rounded p-3 border-l-4 border-green-500">
                      <div className="font-bold text-sm">Rule 3: Default Weighted Ensemble</div>
                      <div className="text-xs mt-1 font-mono bg-gray-100 p-2 rounded">
                        ELSE:<br/>
                        &nbsp;&nbsp;RETURN 0.6 * specialist + 0.4 * anchor
                      </div>
                      <div className="text-xs text-gray-600 mt-1">For uncertain cases, blend both models</div>
                    </div>
                  </div>
                </div>

                <div className="text-2xl text-gray-400">↓</div>

                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6 max-w-2xl text-center">
                  <div className="text-xl font-bold">FINAL PREDICTION</div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <div className="font-bold">Accuracy</div>
                      <div className="text-2xl">89%</div>
                    </div>
                    <div>
                      <div className="font-bold">Macro F1</div>
                      <div className="text-2xl">0.57</div>
                    </div>
                    <div>
                      <div className="font-bold">U2R F1</div>
                      <div className="text-2xl">0.42</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'training' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center mb-8">Model Training Workflow</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Specialist Training Pipeline */}
                <div className="border-2 border-purple-400 rounded-lg p-5 bg-white">
                  <div className="bg-purple-600 text-white p-3 rounded font-bold text-center mb-6">
                    Specialist Training Pipeline (Neural)
                  </div>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Data Preparation", desc: "Load augmented NSL-KDD (~200k samples). Split: 80% Train / 20% Val." },
                      { step: 2, title: "Class Weighting", desc: "Calculate inverse frequency weights. Apply boost factors (U2R: 40x, R2L: 20x)." },
                      { step: 3, title: "Architecture Init", desc: "MLAR-Net (512-256-128). Xavier Normal Initialization." },
                      { step: 4, title: "Optimization Loop", desc: "AdamW Optimizer (lr=1e-3). Loss: Weighted CE + Center Loss (λ=0.1)." },
                      { step: 5, title: "Refinement", desc: "Logit Sharpening (T=0.8). Early stopping on Macro-F1 plateau." }
                    ].map(s => (
                      <div key={s.step} className="flex items-start space-x-3">
                        <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">{s.step}</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{s.title}</p>
                          <p className="text-xs text-gray-600">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anchor Training Pipeline */}
                <div className="border-2 border-green-400 rounded-lg p-5 bg-white">
                  <div className="bg-green-600 text-white p-3 rounded font-bold text-center mb-6">
                    Anchor Training Pipeline (XGBoost)
                  </div>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Feature Engineering", desc: "One-hot encoding for categorical features. RobustScaler for numeric scales." },
                      { step: 2, title: "Hyperparameter Search", desc: "GridSearch for depth (8-12) and learning rate (0.01-0.2)." },
                      { step: 3, title: "Tree Construction", desc: "Train 400 trees using 'hist' method for GPU acceleration." },
                      { step: 4, title: "Cross-Validation", desc: "5-fold CV to ensure stability across DoS and Probe classes." },
                      { step: 5, title: "Model Serializing", desc: "Export JSON model for low-latency inference engine." }
                    ].map(s => (
                      <div key={s.step} className="flex items-start space-x-3">
                        <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">{s.step}</div>
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{s.title}</p>
                          <p className="text-xs text-gray-600">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeChart === 'prediction' && (
            <div className="space-y-6 animate-fadeIn">
              <h2 className="text-2xl font-bold text-center mb-8">Real-time Prediction Flow (MLAR-Fusion)</h2>
              <div className="flex flex-col items-center">
                <div className="bg-gray-800 text-white p-3 rounded-md w-64 text-center mb-4">Input Network Packet</div>
                <div className="text-2xl text-gray-400">↓</div>
                <div className="bg-blue-100 border border-blue-300 p-3 rounded-md w-80 text-center mb-4 text-sm">Feature Extraction (41-dims)</div>
                <div className="flex justify-center space-x-20 w-full max-w-2xl relative">
                  <div className="absolute top-0 left-1/2 w-0.5 h-8 bg-gray-300 -translate-y-8"></div>
                  <div className="flex flex-col items-center">
                    <div className="bg-purple-100 border border-purple-400 p-4 rounded text-center w-40">
                      <p className="font-bold text-xs">MLAR Specialist</p>
                      <p className="text-[10px] text-purple-700 italic">Deep Probabilities</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="bg-green-100 border border-green-400 p-4 rounded text-center w-40">
                      <p className="font-bold text-xs">XGBoost Anchor</p>
                      <p className="text-[10px] text-green-700 italic">Decision Scores</p>
                    </div>
                  </div>
                </div>
                <div className="text-2xl text-gray-400 my-4">↓</div>
                <div className="bg-orange-500 text-white p-4 rounded-lg shadow-lg w-full max-w-md text-center">
                  <p className="font-bold">Dynamic Bayesian Fusion Gate</p>
                  <p className="text-xs mt-1 opacity-90">Context-aware selection based on class rarity & confidence</p>
                </div>
                <div className="text-2xl text-gray-400 my-4">↓</div>
                <div className="bg-white border-4 border-double border-gray-400 p-4 rounded-xl w-64 text-center">
                  <p className="text-xs uppercase tracking-widest text-gray-500">Final Result</p>
                  <p className="font-bold text-lg text-red-600">ATTACK DETECTED</p>
                  <p className="text-[10px] text-gray-400">Response: Drop Connection / Alert Admin</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowchartDiagrams;