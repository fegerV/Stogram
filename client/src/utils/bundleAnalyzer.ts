interface BundleInfo {
  name: string;
  size: number;
  chunks: string[];
  dependencies: string[];
  loadTime: number;
}

interface BundleAnalysis {
  totalSize: number;
  bundles: BundleInfo[];
  recommendations: string[];
  largestBundles: BundleInfo[];
  optimizationOpportunities: string[];
}

class BundleAnalyzer {
  private bundleCache: Map<string, BundleInfo> = new Map();
  private analysisHistory: BundleAnalysis[] = [];

  constructor() {
    this.trackInitialBundles();
  }

  private trackInitialBundles() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      entries.forEach(entry => {
        if (this.isJavaScriptBundle(entry.name)) {
          this.trackBundle(entry.name, entry.transferSize || 0, entry.duration);
        }
      });
    }
  }

  private isJavaScriptBundle(url: string): boolean {
    return url.includes('.js') && !url.includes('node_modules') && !url.includes('hot-update');
  }

  trackBundle(name: string, size: number, loadTime: number) {
    const bundleInfo: BundleInfo = {
      name: name.split('/').pop() || name,
      size,
      chunks: this.extractChunks(name),
      dependencies: this.extractDependencies(name),
      loadTime,
    };

    this.bundleCache.set(bundleInfo.name, bundleInfo);
    
    // Trigger performance monitoring
    if (window.performanceMonitor) {
      window.performanceMonitor.trackBundleLoad(bundleInfo.name, size, loadTime);
    }
  }

  private extractChunks(name: string): string[] {
    // Extract chunk information from bundle name
    const chunkMatch = name.match(/(.+)-(\w+)\.js$/);
    if (chunkMatch) {
      return [chunkMatch[1]];
    }
    return ['main'];
  }

  private extractDependencies(name: string): string[] {
    // This would typically be analyzed during build time
    // For now, return common dependencies based on naming patterns
    const dependencies: string[] = [];
    
    if (name.includes('vendor')) {
      dependencies.push('vendor-libraries');
    }
    if (name.includes('react')) {
      dependencies.push('react', 'react-dom');
    }
    if (name.includes('router')) {
      dependencies.push('react-router-dom');
    }
    
    return dependencies;
  }

  analyzeBundles(): BundleAnalysis {
    const bundles = Array.from(this.bundleCache.values());
    const totalSize = bundles.reduce((sum, bundle) => sum + bundle.size, 0);
    
    // Sort bundles by size
    const sortedBundles = bundles.sort((a, b) => b.size - a.size);
    const largestBundles = sortedBundles.slice(0, 5);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(bundles, totalSize);
    const optimizationOpportunities = this.identifyOptimizationOpportunities(bundles);

    const analysis: BundleAnalysis = {
      totalSize,
      bundles: sortedBundles,
      recommendations,
      largestBundles,
      optimizationOpportunities,
    };

    this.analysisHistory.push(analysis);
    
    // Keep only last 10 analyses
    if (this.analysisHistory.length > 10) {
      this.analysisHistory = this.analysisHistory.slice(-10);
    }

    return analysis;
  }

  private generateRecommendations(bundles: BundleInfo[], totalSize: number): string[] {
    const recommendations: string[] = [];
    
    // Check for large bundles
    const largeBundles = bundles.filter(bundle => bundle.size > 250 * 1024); // 250KB
    if (largeBundles.length > 0) {
      recommendations.push(`Consider code splitting for ${largeBundles.length} large bundle(s) over 250KB`);
    }

    // Check total bundle size
    if (totalSize > 1024 * 1024) { // 1MB
      recommendations.push('Total bundle size exceeds 1MB. Consider tree shaking and removing unused dependencies');
    }

    // Check for duplicate dependencies
    const duplicateDeps = this.findDuplicateDependencies(bundles);
    if (duplicateDeps.length > 0) {
      recommendations.push(`Found duplicate dependencies: ${duplicateDeps.join(', ')}. Consider vendor chunk optimization`);
    }

    // Check load times
    const slowBundles = bundles.filter(bundle => bundle.loadTime > 200); // 200ms
    if (slowBundles.length > 0) {
      recommendations.push(`${slowBundles.length} bundle(s) taking longer than 200ms to load. Consider compression or CDN`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Bundle sizes are within acceptable limits');
    }

    return recommendations;
  }

  private findDuplicateDependencies(bundles: BundleInfo[]): string[] {
    const dependencyCount = new Map<string, number>();
    
    bundles.forEach(bundle => {
      bundle.dependencies.forEach(dep => {
        dependencyCount.set(dep, (dependencyCount.get(dep) || 0) + 1);
      });
    });

    return Array.from(dependencyCount.entries())
      .filter(([_, count]) => count > 1)
      .map(([dep, _]) => dep);
  }

  private identifyOptimizationOpportunities(bundles: BundleInfo[]): string[] {
    const opportunities: string[] = [];
    
    // Check for lazy loading opportunities
    const lazyLoadCandidates = bundles.filter(bundle => 
      bundle.name.includes('admin') || 
      bundle.name.includes('analytics') || 
      bundle.name.includes('settings')
    );
    
    if (lazyLoadCandidates.length > 0) {
      opportunities.push(`Consider lazy loading ${lazyLoadCandidates.length} feature-specific bundle(s)`);
    }

    // Check for vendor optimization
    const vendorBundles = bundles.filter(bundle => bundle.name.includes('vendor'));
    if (vendorBundles.length > 1) {
      opportunities.push('Multiple vendor bundles detected. Consider consolidating into a single vendor chunk');
    }

    // Check for image optimization
    const imageHeavyBundles = bundles.filter(bundle => bundle.size > 100 * 1024);
    if (imageHeavyBundles.length > 0) {
      opportunities.push('Consider image optimization and lazy loading for large bundles');
    }

    return opportunities;
  }

  getBundleAnalysisHistory(): BundleAnalysis[] {
    return this.analysisHistory;
  }

  clearCache() {
    this.bundleCache.clear();
    this.analysisHistory = [];
  }

  // Export bundle analysis for external analysis
  exportAnalysis(): string {
    const analysis = this.analyzeBundles();
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      analysis,
      history: this.analysisHistory,
    }, null, 2);
  }

  // Get bundle size distribution
  getSizeDistribution(): { [key: string]: number } {
    const bundles = Array.from(this.bundleCache.values());
    const distribution: { [key: string]: number } = {
      small: 0, // < 50KB
      medium: 0, // 50KB - 150KB
      large: 0, // 150KB - 250KB
      xlarge: 0, // > 250KB
    };

    bundles.forEach(bundle => {
      if (bundle.size < 50 * 1024) {
        distribution.small++;
      } else if (bundle.size < 150 * 1024) {
        distribution.medium++;
      } else if (bundle.size < 250 * 1024) {
        distribution.large++;
      } else {
        distribution.xlarge++;
      }
    });

    return distribution;
  }
}

// Create singleton instance
export const bundleAnalyzer = new BundleAnalyzer();

// Make it globally available for performance monitoring
declare global {
  interface Window {
    bundleAnalyzer?: BundleAnalyzer;
    performanceMonitor?: any;
  }
}

if (typeof window !== 'undefined') {
  window.bundleAnalyzer = bundleAnalyzer;
}