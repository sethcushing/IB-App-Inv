import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Treemap
} from 'recharts';
import {
  Sparkles, AlertTriangle, DollarSign, Users, TrendingDown, Shield,
  Loader2, RefreshCw, ChevronRight, Target, Zap, AlertCircle,
  CheckCircle2, XCircle, Building2, Layers
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useTheme } from '../context/ThemeContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (value) => {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
};

const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'text-red-500 bg-red-500/15 border-red-500/30';
    case 'high': return 'text-orange-500 bg-orange-500/15 border-orange-500/30';
    case 'medium': return 'text-amber-500 bg-amber-500/15 border-amber-500/30';
    case 'low': return 'text-green-500 bg-green-500/15 border-green-500/30';
    default: return 'text-theme-muted bg-[var(--glass-highlight)] border-[var(--glass-border)]';
  }
};

const getEffortBadge = (effort) => {
  switch (effort?.toLowerCase()) {
    case 'low': return 'badge-green';
    case 'medium': return 'badge-amber';
    case 'high': return 'badge-red';
    default: return 'bg-[var(--glass-highlight)] text-theme-muted';
  }
};

const HeatmapPage = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const chartColors = {
    grid: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    tick: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.6)',
  };

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axios.post(`${API}/ai/portfolio-heatmap`);
      setAnalysis(res.data);
      toast.success('Portfolio analysis complete');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.detail || 'Failed to generate analysis');
      toast.error('Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const totalPotentialSavings = analysis?.consolidation_opportunities?.reduce(
    (sum, opp) => sum + (opp.estimated_savings || 0), 0
  ) || 0;

  const clusterColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-theme-primary flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            Executive Portfolio Heatmap
          </h1>
          <p className="text-theme-muted mt-1">
            AI-powered C-Suite analysis of application overlap, risks, and optimization opportunities
          </p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading}
          data-testid="run-analysis-btn"
          className="bg-purple-600 hover:bg-purple-500 text-white font-medium"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Portfolio...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              {analysis ? 'Refresh Analysis' : 'Generate Analysis'}
            </>
          )}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
          <h3 className="text-lg font-heading font-semibold text-theme-primary mb-2">
            Analyzing Your Portfolio
          </h3>
          <p className="text-theme-muted text-sm max-w-md mx-auto">
            GPT-4o is reviewing all applications for capability overlaps, consolidation opportunities, 
            risk areas, and optimization recommendations. This may take 30-60 seconds.
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="glass-card p-6 border-l-4 border-l-red-500 bg-gradient-to-r from-red-500/10 to-transparent">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-theme-primary">Analysis Failed</h4>
              <p className="text-sm text-theme-muted mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={runAnalysis} 
                className="mt-3 bg-[var(--glass-highlight)] border-[var(--glass-border)] text-theme-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!analysis && !loading && !error && (
        <div className="glass-card p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Layers className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-heading font-semibold text-theme-primary mb-3">
            Portfolio Intelligence Ready
          </h3>
          <p className="text-theme-muted max-w-lg mx-auto mb-6">
            Click "Generate Analysis" to have GPT-4o analyze your entire application portfolio and provide 
            executive-level insights on overlaps, consolidation opportunities, risks, and cost optimization.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-theme-muted">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Overlap Clusters
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              Savings Opportunities
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              Risk Analysis
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              Underutilized Apps
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !loading && (
        <>
          {/* Executive Summary */}
          <div className="ai-analysis-card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-theme-primary text-lg">Executive Summary</h3>
                <p className="text-theme-secondary mt-2 leading-relaxed">
                  {analysis.executive_summary}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-theme-muted">
                    <Building2 className="w-4 h-4" />
                    {analysis.metadata?.total_apps_analyzed} Apps Analyzed
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(analysis.metadata?.total_portfolio_spend)} Portfolio Spend
                  </div>
                  <div className="flex items-center gap-2 text-blue-400">
                    <Users className="w-4 h-4" />
                    {analysis.metadata?.total_engaged_users?.toLocaleString()} Users
                  </div>
                  {totalPotentialSavings > 0 && (
                    <div className="flex items-center gap-2 text-amber-400">
                      <Target className="w-4 h-4" />
                      {formatCurrency(totalPotentialSavings)} Potential Savings
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <Layers className="w-8 h-8 text-purple-400" />
                <Badge className="badge-purple text-xs">{analysis.overlap_clusters?.filter(c => c.severity === 'high').length || 0} High</Badge>
              </div>
              <p className="text-2xl font-heading font-bold text-theme-primary mt-3">
                {analysis.overlap_clusters?.length || 0}
              </p>
              <p className="text-sm text-theme-muted">Overlap Clusters</p>
            </div>
            
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-green-400" />
                <Badge className="badge-green text-xs">Savings</Badge>
              </div>
              <p className="text-2xl font-heading font-bold text-theme-primary mt-3">
                {formatCurrency(totalPotentialSavings)}
              </p>
              <p className="text-sm text-theme-muted">Consolidation Savings</p>
            </div>
            
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <Badge className="badge-red text-xs">{analysis.risk_areas?.filter(r => r.severity === 'critical' || r.severity === 'high').length || 0} Critical</Badge>
              </div>
              <p className="text-2xl font-heading font-bold text-theme-primary mt-3">
                {analysis.risk_areas?.length || 0}
              </p>
              <p className="text-sm text-theme-muted">Risk Areas</p>
            </div>
            
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <TrendingDown className="w-8 h-8 text-amber-400" />
                <Badge className="badge-amber text-xs">Review</Badge>
              </div>
              <p className="text-2xl font-heading font-bold text-theme-primary mt-3">
                {analysis.underutilized_high_cost?.length || 0}
              </p>
              <p className="text-sm text-theme-muted">Underutilized Apps</p>
            </div>
          </div>

          {/* Priority Actions */}
          {analysis.action_items?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Priority Actions
              </h3>
              <div className="space-y-3">
                {analysis.action_items.map((action, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-xl bg-[var(--glass-highlight)] border border-[var(--glass-border)]"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      action.priority === 1 ? 'bg-red-500/20 text-red-400' :
                      action.priority === 2 ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {action.priority}
                    </div>
                    <div className="flex-1">
                      <p className="text-theme-primary font-medium">{action.action}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <Badge className={action.impact === 'high' ? 'badge-red' : 'badge-amber'}>
                          {action.impact} impact
                        </Badge>
                        {action.estimated_savings > 0 && (
                          <span className="text-green-400">
                            Est. savings: {formatCurrency(action.estimated_savings)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overlap Clusters */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Capability Overlap Clusters
              </h3>
              {analysis.overlap_clusters?.length > 0 ? (
                <div className="space-y-4">
                  {analysis.overlap_clusters.map((cluster, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border ${getSeverityColor(cluster.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-theme-primary">{cluster.cluster_name}</h4>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cluster.apps?.map((app, i) => (
                              <Badge key={i} className="text-xs bg-[var(--glass-bg)] text-theme-secondary border border-[var(--glass-border)]">
                                {app}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Badge className={getSeverityColor(cluster.severity)}>
                          {cluster.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-theme-muted mt-3">{cluster.recommendation}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="text-theme-muted">
                          Combined: <span className="text-theme-primary font-medium">{formatCurrency(cluster.combined_spend)}</span>
                        </span>
                        {cluster.potential_savings > 0 && (
                          <span className="text-green-400">
                            Save: {formatCurrency(cluster.potential_savings)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-theme-muted text-center py-8">No significant overlaps detected</p>
              )}
            </div>

            {/* Risk Areas */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Risk Areas
              </h3>
              {analysis.risk_areas?.length > 0 ? (
                <div className="space-y-4">
                  {analysis.risk_areas.map((risk, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-xl border ${getSeverityColor(risk.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {risk.severity === 'critical' ? (
                            <XCircle className="w-5 h-5 text-red-400" />
                          ) : risk.severity === 'high' ? (
                            <AlertTriangle className="w-5 h-5 text-orange-400" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-amber-400" />
                          )}
                          <span className="text-xs text-theme-muted uppercase tracking-wide">
                            {risk.risk_type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <Badge className={getSeverityColor(risk.severity)}>
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-theme-primary mt-2">{risk.description}</p>
                      {risk.affected_apps?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {risk.affected_apps.map((app, i) => (
                            <Badge key={i} className="text-xs bg-[var(--glass-bg)] text-theme-secondary border border-[var(--glass-border)]">
                              {app}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                        <p className="text-sm text-theme-secondary">
                          <span className="text-theme-muted">Mitigation:</span> {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-theme-muted text-center py-8">No significant risks identified</p>
              )}
            </div>
          </div>

          {/* Consolidation Opportunities */}
          {analysis.consolidation_opportunities?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-green-400" />
                Consolidation Opportunities
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="consolidation-table">
                  <thead>
                    <tr className="table-header border-b-2 border-[var(--glass-border)]">
                      <th className="p-4 text-left">Opportunity</th>
                      <th className="p-4 text-left">Apps Involved</th>
                      <th className="p-4 text-right">Current Spend</th>
                      <th className="p-4 text-right">Est. Savings</th>
                      <th className="p-4 text-center">Effort</th>
                      <th className="p-4 text-left">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.consolidation_opportunities.map((opp, idx) => (
                      <tr key={idx} className="table-row-bordered hover:bg-[var(--glass-highlight)] transition-colors">
                        <td className="p-4 font-medium text-theme-primary">{opp.title}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {opp.apps_involved?.map((app, i) => (
                              <Badge key={i} className="text-xs bg-[var(--glass-highlight)] text-theme-secondary border border-[var(--glass-border)]">
                                {app}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono text-theme-secondary">
                          {formatCurrency(opp.current_spend)}
                        </td>
                        <td className="p-4 text-right font-mono text-green-400 font-medium">
                          {formatCurrency(opp.estimated_savings)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge className={getEffortBadge(opp.effort)}>
                            {opp.effort}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-theme-muted max-w-[200px]">
                          {opp.rationale}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Underutilized High-Cost Apps */}
          {analysis.underutilized_high_cost?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-400" />
                Underutilized High-Cost Applications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysis.underutilized_high_cost.map((app, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
                  >
                    <h4 className="font-medium text-theme-primary">{app.app_title}</h4>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div>
                        <p className="text-lg font-heading font-bold text-theme-primary">
                          {formatCurrency(app.annual_spend)}
                        </p>
                        <p className="text-xs text-theme-muted">Annual Spend</p>
                      </div>
                      <div>
                        <p className="text-lg font-heading font-bold text-amber-400">
                          {app.engaged_users}
                        </p>
                        <p className="text-xs text-theme-muted">Users</p>
                      </div>
                      <div>
                        <p className="text-lg font-heading font-bold text-red-400">
                          {formatCurrency(app.cost_per_user)}
                        </p>
                        <p className="text-xs text-theme-muted">Per User</p>
                      </div>
                    </div>
                    <p className="text-sm text-theme-secondary mt-3 pt-3 border-t border-amber-500/20">
                      {app.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown Chart */}
          {analysis.category_breakdown?.length > 0 && (
            <div className="glass-card p-6">
              <h3 className="text-lg font-heading font-semibold text-theme-primary mb-4 flex items-center gap-2">
                <BarChart className="w-5 h-5 text-blue-400" />
                Spend by Category
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={analysis.category_breakdown.sort((a, b) => b.total_spend - a.total_spend).slice(0, 10)}
                    layout="vertical"
                    margin={{ left: 100, right: 20, top: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis 
                      type="number" 
                      tickFormatter={(v) => formatCurrency(v)}
                      tick={{ fontSize: 12, fill: chartColors.tick }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="category" 
                      tick={{ fontSize: 12, fill: chartColors.tick }}
                      width={90}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'var(--sidebar-bg)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="total_spend" radius={[0, 4, 4, 0]}>
                      {analysis.category_breakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.overlap_risk === 'high' ? '#ef4444' : 
                                entry.overlap_risk === 'medium' ? '#f59e0b' : '#22c55e'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-theme-muted">High Overlap Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-theme-muted">Medium Overlap Risk</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-theme-muted">Low Overlap Risk</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-theme-faint py-4">
            Analysis generated at {new Date(analysis.metadata?.generated_at).toLocaleString()} using GPT-4o
          </div>
        </>
      )}
    </div>
  );
};

export default HeatmapPage;
