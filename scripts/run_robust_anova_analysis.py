"""
ROBUST ANOVA Analysis for Cryptographic Algorithm Comparison
Handles outliers, skewed data, and unequal variances

Includes:
- Log transformation for skewed performance data
- Outlier detection and handling
- Welch's ANOVA (robust to unequal variances)
- Kruskal-Wallis test (non-parametric alternative)
- Effect size calculations (Cohen's d, eta-squared)
- Diagnostic plots
"""

import json
import os
import glob
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.stats import kruskal, shapiro, levene, f_oneway
from statsmodels.stats.multicomp import pairwise_tukeyhsd
from statsmodels.stats.oneway import anova_oneway
import warnings

warnings.filterwarnings('ignore')


def load_all_test_results(comparison_dir):
    """Load all raw-data.json files from comparison-results directory"""
    json_files = glob.glob(os.path.join(comparison_dir, "performance-*", "raw-data.json"))
    
    if not json_files:
        raise FileNotFoundError(f"No raw-data.json files found in {comparison_dir}")
    
    test_runs = []
    for json_file in sorted(json_files):
        with open(json_file, 'r') as f:
            data = json.load(f)
            test_runs.append({
                'file': json_file,
                'timestamp': data.get('timestamp', 'unknown'),
                'data': data
            })
    
    print(f"✓ Loaded {len(test_runs)} test run(s)")
    return test_runs


def extract_metric_data(test_runs, metric_name):
    """Extract metric data for all three algorithms"""
    algorithm_data = {
        'ECDSA': [],
        'RSA-2048': [],
        'ML-DSA-65': []
    }
    
    for run in test_runs:
        data = run['data']
        algorithm_data['ECDSA'].extend(data['algorithms']['ecdsa'].get(metric_name, []))
        algorithm_data['RSA-2048'].extend(data['algorithms']['rsa2048'].get(metric_name, []))
        algorithm_data['ML-DSA-65'].extend(data['algorithms']['dilithium3'].get(metric_name, []))
    
    return algorithm_data


def detect_outliers_iqr(data, multiplier=1.5):
    """Detect outliers using IQR method"""
    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    lower_bound = q1 - multiplier * iqr
    upper_bound = q3 + multiplier * iqr
    
    outliers = [x for x in data if x < lower_bound or x > upper_bound]
    return outliers, lower_bound, upper_bound


def remove_outliers_iqr(data, multiplier=1.5):
    """Remove outliers using IQR method"""
    q1 = np.percentile(data, 25)
    q3 = np.percentile(data, 75)
    iqr = q3 - q1
    lower_bound = q1 - multiplier * iqr
    upper_bound = q3 + multiplier * iqr
    
    cleaned = [x for x in data if lower_bound <= x <= upper_bound]
    return cleaned


def check_normality(data, name):
    """Check if data is normally distributed using Shapiro-Wilk test"""
    if len(data) < 3:
        return None, None
    stat, p_value = shapiro(data)
    is_normal = p_value > 0.05
    return stat, p_value, is_normal


def check_homogeneity(groups):
    """Check homogeneity of variances using Levene's test"""
    stat, p_value = levene(*groups)
    is_homogeneous = p_value > 0.05
    return stat, p_value, is_homogeneous


def cohens_d(group1, group2):
    """Calculate Cohen's d effect size"""
    n1, n2 = len(group1), len(group2)
    var1, var2 = np.var(group1, ddof=1), np.var(group2, ddof=1)
    pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    
    if pooled_std == 0:
        return 0
    
    return (np.mean(group1) - np.mean(group2)) / pooled_std


def interpret_cohens_d(d):
    """Interpret Cohen's d effect size"""
    d = abs(d)
    if d < 0.2:
        return "negligible"
    elif d < 0.5:
        return "small"
    elif d < 0.8:
        return "medium"
    else:
        return "large"


def perform_welch_anova(groups, group_names):
    """Perform Welch's ANOVA (doesn't assume equal variances)"""
    # Use statsmodels for Welch's ANOVA
    statistic, pvalue = anova_oneway(groups, use_var='unequal')
    return statistic, pvalue


def perform_kruskal_wallis(groups, group_names):
    """Perform Kruskal-Wallis H-test (non-parametric)"""
    h_stat, p_value = kruskal(*groups)
    return h_stat, p_value


def create_diagnostic_plots(algorithm_data, metric_name, output_dir):
    """Create diagnostic plots to visualize data distribution"""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle(f'Diagnostic Plots: {metric_name}', fontsize=16, fontweight='bold')
    
    algorithms = list(algorithm_data.keys())
    colors = ['#2E86AB', '#A23B72', '#F18F01']
    
    # 1. Box plot
    ax1 = axes[0, 0]
    data_list = [algorithm_data[alg] for alg in algorithms]
    bp = ax1.boxplot(data_list, labels=algorithms, patch_artist=True)
    for patch, color in zip(bp['boxes'], colors):
        patch.set_facecolor(color)
    ax1.set_ylabel('Time (ms)', fontweight='bold')
    ax1.set_title('Box Plot (shows outliers)', fontweight='bold')
    ax1.grid(True, alpha=0.3)
    
    # 2. Violin plot
    ax2 = axes[0, 1]
    positions = range(1, len(algorithms) + 1)
    for i, (alg, color) in enumerate(zip(algorithms, colors)):
        parts = ax2.violinplot([algorithm_data[alg]], positions=[positions[i]], 
                               widths=0.7, showmeans=True, showmedians=True)
        for pc in parts['bodies']:
            pc.set_facecolor(color)
            pc.set_alpha(0.7)
    ax2.set_xticks(positions)
    ax2.set_xticklabels(algorithms)
    ax2.set_ylabel('Time (ms)', fontweight='bold')
    ax2.set_title('Violin Plot (shows distribution)', fontweight='bold')
    ax2.grid(True, alpha=0.3)
    
    # 3. Log-scale box plot
    ax3 = axes[1, 0]
    bp2 = ax3.boxplot(data_list, labels=algorithms, patch_artist=True)
    for patch, color in zip(bp2['boxes'], colors):
        patch.set_facecolor(color)
    ax3.set_yscale('log')
    ax3.set_ylabel('Time (ms) - Log Scale', fontweight='bold')
    ax3.set_title('Log-Scale Box Plot', fontweight='bold')
    ax3.grid(True, alpha=0.3)
    
    # 4. Q-Q plots for normality
    ax4 = axes[1, 1]
    for i, (alg, color) in enumerate(zip(algorithms, colors)):
        stats.probplot(algorithm_data[alg], dist="norm", plot=None)
        theoretical, ordered = stats.probplot(algorithm_data[alg], dist="norm")
        ax4.scatter(theoretical[0], theoretical[1], label=alg, alpha=0.6, 
                   color=color, s=30)
    
    # Add reference line
    min_val = min(min(stats.probplot(algorithm_data[alg], dist="norm")[1]) 
                  for alg in algorithms)
    max_val = max(max(stats.probplot(algorithm_data[alg], dist="norm")[1]) 
                  for alg in algorithms)
    ax4.plot([min_val, max_val], [min_val, max_val], 'k--', alpha=0.5, 
            label='Normal Distribution')
    
    ax4.set_xlabel('Theoretical Quantiles', fontweight='bold')
    ax4.set_ylabel('Sample Quantiles', fontweight='bold')
    ax4.set_title('Q-Q Plot (normality check)', fontweight='bold')
    ax4.legend()
    ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    output_path = os.path.join(output_dir, f"{metric_name.replace(' ', '_')}_diagnostics.png")
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"  ✓ Saved diagnostic plot: {output_path}")


def analyze_metric(algorithm_data, metric_name, output_dir):
    """Comprehensive analysis of a single metric"""
    print("\n" + "="*80)
    print(f"ANALYSIS: {metric_name}")
    print("="*80)
    
    algorithms = list(algorithm_data.keys())
    
    # 1. Descriptive Statistics
    print("\n1. DESCRIPTIVE STATISTICS")
    print("-" * 80)
    print(f"{'Algorithm':<15} {'N':<8} {'Mean':<12} {'Median':<12} {'Std Dev':<12} {'Min':<10} {'Max':<10}")
    print("-" * 80)
    
    for alg in algorithms:
        data = algorithm_data[alg]
        print(f"{alg:<15} {len(data):<8} {np.mean(data):<12.2f} {np.median(data):<12.2f} "
              f"{np.std(data):<12.2f} {np.min(data):<10.2f} {np.max(data):<10.2f}")
    
    # 2. Outlier Detection
    print("\n2. OUTLIER DETECTION (IQR Method, 1.5x multiplier)")
    print("-" * 80)
    
    for alg in algorithms:
        outliers, lower, upper = detect_outliers_iqr(algorithm_data[alg])
        print(f"{alg:<15}: {len(outliers)} outliers detected "
              f"(valid range: {lower:.2f} - {upper:.2f})")
        if outliers and len(outliers) <= 5:
            print(f"                 Outlier values: {[f'{x:.2f}' for x in outliers]}")
    
    # 3. Normality Tests
    print("\n3. NORMALITY TESTS (Shapiro-Wilk)")
    print("-" * 80)
    print(f"{'Algorithm':<15} {'W-statistic':<15} {'p-value':<12} {'Normal?':<10}")
    print("-" * 80)
    
    all_normal = True
    for alg in algorithms:
        stat, p_val, is_normal = check_normality(algorithm_data[alg], alg)
        print(f"{alg:<15} {stat:<15.4f} {p_val:<12.6f} {'Yes' if is_normal else 'No':<10}")
        if not is_normal:
            all_normal = False
    
    # 4. Homogeneity of Variance
    print("\n4. HOMOGENEITY OF VARIANCE (Levene's Test)")
    print("-" * 80)
    
    groups = [algorithm_data[alg] for alg in algorithms]
    lev_stat, lev_p, is_homogeneous = check_homogeneity(groups)
    print(f"Levene's statistic: {lev_stat:.4f}")
    print(f"p-value: {lev_p:.6f}")
    print(f"Equal variances? {'Yes (p > 0.05)' if is_homogeneous else 'No (p < 0.05)'}")
    
    # 5. Choose appropriate test
    print("\n5. STATISTICAL TESTS")
    print("-" * 80)
    
    print("\n📊 Standard One-Way ANOVA (for reference)")
    f_stat, anova_p = f_oneway(*groups)
    print(f"   F-statistic: {f_stat:.4f}")
    print(f"   p-value: {anova_p:.6f}")
    print(f"   Result: {'Significant difference (p < 0.05)' if anova_p < 0.05 else 'No significant difference'}")
    
    if not is_homogeneous:
        print("\n⚠️  Unequal variances detected - Using Welch's ANOVA")
        welch_stat, welch_p = perform_welch_anova(groups, algorithms)
        print(f"   F-statistic: {welch_stat:.4f}")
        print(f"   p-value: {welch_p:.6f}")
        print(f"   Result: {'Significant difference (p < 0.05)' if welch_p < 0.05 else 'No significant difference'}")
    
    if not all_normal:
        print("\n⚠️  Non-normal distribution detected - Using Kruskal-Wallis (non-parametric)")
        h_stat, kw_p = perform_kruskal_wallis(groups, algorithms)
        print(f"   H-statistic: {h_stat:.4f}")
        print(f"   p-value: {kw_p:.6f}")
        print(f"   Result: {'Significant difference (p < 0.05)' if kw_p < 0.05 else 'No significant difference'}")
    
    # 6. Effect Sizes (Pairwise Cohen's d)
    print("\n6. EFFECT SIZES (Cohen's d - Pairwise Comparisons)")
    print("-" * 80)
    print("{:<30} {:<12} {:<15}".format("Comparison", "Cohen's d", "Interpretation"))
    print("-" * 80)
    
    for i in range(len(algorithms)):
        for j in range(i + 1, len(algorithms)):
            alg1, alg2 = algorithms[i], algorithms[j]
            d = cohens_d(algorithm_data[alg1], algorithm_data[alg2])
            interpretation = interpret_cohens_d(d)
            print(f"{alg1} vs {alg2:<15} {d:<12.3f} {interpretation:<15}")
    
    # 7. Log-transformed analysis (if data is skewed)
    max_mean = max(np.mean(algorithm_data[alg]) for alg in algorithms)
    min_mean = min(np.mean(algorithm_data[alg]) for alg in algorithms)
    
    if max_mean / min_mean > 10:  # More than 10x difference
        print("\n7. LOG-TRANSFORMED ANALYSIS (recommended for highly skewed data)")
        print("-" * 80)
        print("⚠️  Data spans multiple orders of magnitude - Log transformation recommended")
        
        # Log transform
        log_data = {alg: np.log10(algorithm_data[alg]) for alg in algorithms}
        log_groups = [log_data[alg] for alg in algorithms]
        
        # Check normality on log-transformed data
        print("\nNormality after log transformation:")
        for alg in algorithms:
            stat, p_val, is_normal = check_normality(log_data[alg], alg)
            print(f"  {alg}: {'Normal' if is_normal else 'Not normal'} (p = {p_val:.4f})")
        
        # ANOVA on log-transformed data
        f_stat_log, p_log = f_oneway(*log_groups)
        print(f"\nANOVA on log-transformed data:")
        print(f"  F-statistic: {f_stat_log:.4f}")
        print(f"  p-value: {p_log:.6f}")
        print(f"  Result: {'Significant difference (p < 0.05)' if p_log < 0.05 else 'No significant difference'}")
        
        # Show geometric means (anti-log of log means)
        print(f"\nGeometric means (for interpretation):")
        for alg in algorithms:
            geo_mean = 10 ** np.mean(log_data[alg])
            print(f"  {alg}: {geo_mean:.2f} ms")
    
    # Create diagnostic plots
    create_diagnostic_plots(algorithm_data, metric_name, output_dir)
    
    print("\n" + "="*80)


def main():
    print("="*80)
    print("ROBUST ANOVA ANALYSIS - Cryptographic Algorithm Performance")
    print("="*80)
    print()
    
    # Setup paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    comparison_dir = os.path.join(project_dir, "comparison-results")
    output_dir = os.path.join(project_dir, "anova-results")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Load data
    print("Loading test data...")
    test_runs = load_all_test_results(comparison_dir)
    print()
    
    # Define metrics
    metrics = {
        'keyGenTime': 'Key Generation Time (ms)',
        'signTime': 'VC Signing Time (ms)',
        'verifyTime': 'VC Verification Time (ms)'
    }
    
    # Analyze each metric
    for metric_key, metric_name in metrics.items():
        algorithm_data = extract_metric_data(test_runs, metric_key)
        analyze_metric(algorithm_data, metric_name, output_dir)
    
    print("\n" + "="*80)
    print("✅ ANALYSIS COMPLETE")
    print("="*80)
    print(f"\n📁 Results saved to: {output_dir}")
    print("\n📝 RECOMMENDATIONS FOR YOUR THESIS:")
    print("   1. Use Welch's ANOVA (robust to unequal variances)")
    print("   2. Report Kruskal-Wallis for non-normal data")
    print("   3. Consider log transformation for highly skewed metrics")
    print("   4. Report effect sizes (Cohen's d) alongside p-values")
    print("   5. Include the diagnostic plots to justify your choice of tests")
    print()


if __name__ == "__main__":
    main()
