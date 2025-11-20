export interface BundleChunk {
  name: string;
  size: number;
  loadTime: number;
  cached: boolean;
}

export interface BundleAnalysis {
  chunks: BundleChunk[];
  totalSize: number;
  totalLoadTime: number;
  recommendations: string[];
  optimization: {
    cacheUtilization: number;
    avgChunkSize: number;
    oversizedChunks: BundleChunk[];
    slowChunks: BundleChunk[];
  };
}

class BundleAnalyzer {
  private chunks: Map<string, BundleChunk> = new Map();
  private readonly MAX_CHUNK_SIZE = 250 * 1024; // 250KB
  private readonly MAX_LOAD_TIME = 2000; // 2 seconds

  constructor() {
    this.setupResourceMonitoring();
  }

  private setupResourceMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            
            // Only track JavaScript chunks
            if (
              resourceEntry.initiatorType === 'script' &&
              resourceEntry.name.includes('.js')
            ) {
              this.trackChunk(resourceEntry);
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Bundle analyzer could not initialize:', error);
      }
    }

    // Also check existing resources
    this.analyzeExistingResources();
  }

  private analyzeExistingResources() {
    if (typeof window === 'undefined') return;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    resources.forEach((resource) => {
      if (
        resource.initiatorType === 'script' &&
        resource.name.includes('.js')
      ) {
        this.trackChunk(resource);
      }
    });
  }

  private trackChunk(resource: PerformanceResourceTiming) {
    const name = this.extractChunkName(resource.name);
    const size = resource.transferSize || resource.encodedBodySize || 0;
    const loadTime = resource.duration;
    const cached = resource.transferSize === 0 && resource.decodedBodySize > 0;

    this.chunks.set(name, {
      name,
      size,
      loadTime,
      cached,
    });
  }

  private extractChunkName(url: string): string {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    // Remove hash if present
    return filename.replace(/\.[a-f0-9]{8}\.js/, '.js');
  }

  analyze(): BundleAnalysis {
    const chunks = Array.from(this.chunks.values());
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    const totalLoadTime = chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0);
    
    const oversizedChunks = chunks.filter((chunk) => chunk.size > this.MAX_CHUNK_SIZE);
    const slowChunks = chunks.filter((chunk) => chunk.loadTime > this.MAX_LOAD_TIME);
    const cachedChunks = chunks.filter((chunk) => chunk.cached);
    
    const cacheUtilization = chunks.length > 0 
      ? (cachedChunks.length / chunks.length) * 100 
      : 0;
    
    const avgChunkSize = chunks.length > 0 
      ? totalSize / chunks.length 
      : 0;

    const recommendations = this.generateRecommendations({
      chunks,
      oversizedChunks,
      slowChunks,
      cacheUtilization,
      avgChunkSize,
      totalSize,
    });

    return {
      chunks,
      totalSize,
      totalLoadTime,
      recommendations,
      optimization: {
        cacheUtilization,
        avgChunkSize,
        oversizedChunks,
        slowChunks,
      },
    };
  }

  private generateRecommendations(data: {
    chunks: BundleChunk[];
    oversizedChunks: BundleChunk[];
    slowChunks: BundleChunk[];
    cacheUtilization: number;
    avgChunkSize: number;
    totalSize: number;
  }): string[] {
    const recommendations: string[] = [];

    // Check total bundle size
    if (data.totalSize > 1 * 1024 * 1024) { // > 1MB
      recommendations.push(
        `Total bundle size (${(data.totalSize / 1024 / 1024).toFixed(2)}MB) is large. Consider code splitting more aggressively.`
      );
    }

    // Check oversized chunks
    if (data.oversizedChunks.length > 0) {
      recommendations.push(
        `${data.oversizedChunks.length} chunk(s) exceed 250KB. Consider splitting: ${data.oversizedChunks.map(c => c.name).join(', ')}`
      );
    }

    // Check slow loading chunks
    if (data.slowChunks.length > 0) {
      recommendations.push(
        `${data.slowChunks.length} chunk(s) took longer than 2s to load. Check network or CDN performance.`
      );
    }

    // Check cache utilization
    if (data.cacheUtilization < 50 && data.chunks.length > 3) {
      recommendations.push(
        `Cache utilization is low (${data.cacheUtilization.toFixed(1)}%). Ensure proper cache headers are set.`
      );
    }

    // Check average chunk size
    if (data.avgChunkSize > 200 * 1024) { // > 200KB
      recommendations.push(
        `Average chunk size (${(data.avgChunkSize / 1024).toFixed(2)}KB) is high. Consider more granular splitting.`
      );
    }

    // Check number of chunks
    if (data.chunks.length > 15) {
      recommendations.push(
        `Large number of chunks (${data.chunks.length}) may increase HTTP overhead. Consider consolidating some chunks.`
      );
    } else if (data.chunks.length < 3 && data.totalSize > 500 * 1024) {
      recommendations.push(
        `Few chunks detected. More code splitting could improve initial load time.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('Bundle optimization looks good! No major issues detected.');
    }

    return recommendations;
  }

  getChunkById(name: string): BundleChunk | undefined {
    return this.chunks.get(name);
  }

  getTopChunksBySizeSize(count = 5): BundleChunk[] {
    return Array.from(this.chunks.values())
      .sort((a, b) => b.size - a.size)
      .slice(0, count);
  }

  getTopChunksByLoadTime(count = 5): BundleChunk[] {
    return Array.from(this.chunks.values())
      .sort((a, b) => b.loadTime - a.loadTime)
      .slice(0, count);
  }

  exportAnalysis(): string {
    const analysis = this.analyze();
    return JSON.stringify(analysis, null, 2);
  }

  logAnalysis() {
    const analysis = this.analyze();
    
    console.group('📦 Bundle Analysis');
    console.log('Total Chunks:', analysis.chunks.length);
    console.log('Total Size:', `${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('Total Load Time:', `${analysis.totalLoadTime.toFixed(2)}ms`);
    console.log('Cache Utilization:', `${analysis.optimization.cacheUtilization.toFixed(1)}%`);
    console.log('Average Chunk Size:', `${(analysis.optimization.avgChunkSize / 1024).toFixed(2)}KB`);
    
    if (analysis.optimization.oversizedChunks.length > 0) {
      console.group('⚠️ Oversized Chunks');
      analysis.optimization.oversizedChunks.forEach((chunk) => {
        console.log(`${chunk.name}: ${(chunk.size / 1024).toFixed(2)}KB`);
      });
      console.groupEnd();
    }
    
    if (analysis.optimization.slowChunks.length > 0) {
      console.group('⚠️ Slow Loading Chunks');
      analysis.optimization.slowChunks.forEach((chunk) => {
        console.log(`${chunk.name}: ${chunk.loadTime.toFixed(2)}ms`);
      });
      console.groupEnd();
    }
    
    console.group('💡 Recommendations');
    analysis.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.groupEnd();
    
    console.groupEnd();
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// Auto-analyze on page load (after a delay)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        bundleAnalyzer.logAnalysis();
      }
    }, 3000);
  });
}
