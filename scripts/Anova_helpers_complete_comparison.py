import math
import os
import json
import sys
from scipy.stats import f, t

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')
from statsmodels.stats.multicomp import pairwise_tukeyhsd
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import statistics


def plot_categorical_latency_barchart(df, metric_column, bins, labels, save_dir="plots"):
    """
    Plot a grouped categorical latency bar chart for ECDSA vs ML-DSA-44.

    Parameters:
    - df: DataFrame containing at least 'System' and metric_column.
    - metric_column: Name of the latency column to bin.
    - bins: Numeric bin edges for pd.cut.
    - labels: Display labels for each latency interval.
    """
    required_columns = {'System', metric_column}
    missing_columns = required_columns - set(df.columns)
    if missing_columns:
        raise ValueError(f"Missing required columns: {sorted(missing_columns)}")

    if len(labels) != len(bins) - 1:
        raise ValueError("labels must have exactly len(bins) - 1 elements")

    # Work on a copy so the original DataFrame stays unchanged.
    plot_df = df[['System', metric_column]].copy()
    plot_df = plot_df.dropna(subset=['System', metric_column])

    # Convert continuous latency values into explicit categorical ranges.
    plot_df['Latency Range'] = pd.cut(
        plot_df[metric_column],
        bins=bins,
        labels=labels,
        include_lowest=True,
        right=False
    )

    # Ensure all requested ranges appear in the chart, even with zero counts.
    latency_categories = pd.CategoricalDtype(categories=labels, ordered=True)
    plot_df['Latency Range'] = plot_df['Latency Range'].astype(latency_categories)

    preferred_system_order = ['ECDSA', 'ML-DSA-44', 'Falcon-512', 'FN-DSA']
    present_systems = plot_df['System'].dropna().unique().tolist()
    system_order = [s for s in preferred_system_order if s in present_systems]
    if not system_order:
        system_order = sorted(present_systems)

    grouped = (
        plot_df
        .groupby(['System', 'Latency Range'], observed=False)
        .size()
        .reset_index(name='Count')
    )

    full_index = pd.MultiIndex.from_product(
        [system_order, labels],
        names=['System', 'Latency Range']
    )
    grouped = (
        grouped
        .set_index(['System', 'Latency Range'])
        .reindex(full_index, fill_value=0)
        .reset_index()
    )

    os.makedirs(save_dir, exist_ok=True)
    plt.figure(figsize=(12, 6))
    sns.barplot(
        data=grouped,
        x='Latency Range',
        y='Count',
        hue='System',
        order=labels,
        hue_order=system_order
    )

    plt.xlabel('Latency Range', fontsize=24)
    plt.ylabel('Number of Operations', fontsize=24)
    plt.title(f"{metric_column} Distribution", fontsize=20, fontweight='bold')
    plt.xticks(rotation=25, ha='right', fontsize=20)
    plt.yticks(fontsize=20)
    legend = plt.legend(title='System', loc='upper right', fontsize=20, title_fontsize=20)
    if legend is not None:
        legend.get_frame().set_alpha(0.9)
    plt.tight_layout()

    output_path = os.path.join(save_dir, f"{metric_column.replace(' ', '_')}_distribution_categorical.png")
    plt.savefig(output_path, dpi=300)
    print(f"Saved plot: {output_path}")
    plt.close()

def _format_ms_value(value):
    if isinstance(value, float) and math.isinf(value):
        return "inf"
    rounded = round(float(value), 4)
    if rounded.is_integer():
        return str(int(rounded))
    if abs(rounded) >= 10:
        return f"{rounded:.1f}".rstrip('0').rstrip('.')
    if abs(rounded) >= 1:
        return f"{rounded:.2f}".rstrip('0').rstrip('.')
    return f"{rounded:.3f}".rstrip('0').rstrip('.')


def _nice_step(target_step):
    if target_step <= 0:
        return 1.0
    magnitude = 10 ** math.floor(math.log10(target_step))
    normalized = target_step / magnitude
    if normalized <= 1:
        nice = 1
    elif normalized <= 2:
        nice = 2
    elif normalized <= 2.5:
        nice = 2.5
    elif normalized <= 5:
        nice = 5
    else:
        nice = 10
    return nice * magnitude


def build_reasonable_bins_and_labels(values, core_bin_count=5):
    """
    Build readable latency bins from observed values with an explicit overflow bin.
    """
    numeric_values = [float(v) for v in values if pd.notna(v)]
    if not numeric_values:
        return [0, 1, float('inf')], ['0-1 ms', '> 1 ms']

    sorted_vals = sorted(numeric_values)
    max_val = sorted_vals[-1]
    p95_index = int(0.95 * (len(sorted_vals) - 1))
    p95_val = sorted_vals[p95_index]

    target_step = max(p95_val / core_bin_count, max_val / (core_bin_count * 4), 0.1)
    step = _nice_step(target_step)
    last_finite_edge = max(step, math.ceil(p95_val / step) * step)

    bins = [0.0]
    while bins[-1] < last_finite_edge:
        bins.append(round(bins[-1] + step, 10))

    # Always include an explicit open-ended tail bin for outliers.
    bins.append(float('inf'))

    labels = []
    for i in range(len(bins) - 2):
        left = _format_ms_value(bins[i])
        right = _format_ms_value(bins[i + 1])
        labels.append(f"{left}-{right} ms")
    labels.append(f"> {_format_ms_value(bins[-2])} ms")

    return bins, labels


def build_metric_dataframe(metric_name, columns, system_names):
    records = []
    for system, values in zip(system_names, columns):
        for value in values:
            records.append({'System': system, metric_name: value})
    return pd.DataFrame(records)


def _percentile(values, percentile):
    numeric_values = [float(value) for value in values if pd.notna(value)]
    if not numeric_values:
        return float('nan')

    sorted_values = sorted(numeric_values)
    if len(sorted_values) == 1:
        return sorted_values[0]

    position = (len(sorted_values) - 1) * (percentile / 100.0)
    lower_index = math.floor(position)
    upper_index = math.ceil(position)
    if lower_index == upper_index:
        return sorted_values[lower_index]

    lower_value = sorted_values[lower_index]
    upper_value = sorted_values[upper_index]
    weight = position - lower_index
    return lower_value + (upper_value - lower_value) * weight


def _mean_confidence_interval(values, confidence=0.95):
    numeric_values = [float(value) for value in values if pd.notna(value)]
    if len(numeric_values) < 2:
        return float('nan'), float('nan')

    mean_value = sum(numeric_values) / len(numeric_values)
    sample_std = statistics.stdev(numeric_values)
    margin = t.ppf((1 + confidence) / 2.0, len(numeric_values) - 1) * (sample_std / math.sqrt(len(numeric_values)))
    return mean_value - margin, mean_value + margin


def _describe_group(values, confidence=0.95):
    numeric_values = [float(value) for value in values if pd.notna(value)]
    if not numeric_values:
        return {
            'n': 0,
            'mean': float('nan'),
            'median': float('nan'),
            'std': float('nan'),
            'ci_low': float('nan'),
            'ci_high': float('nan'),
            'p95': float('nan'),
            'p99': float('nan')
        }

    ci_low, ci_high = _mean_confidence_interval(numeric_values, confidence=confidence)
    return {
        'n': len(numeric_values),
        'mean': sum(numeric_values) / len(numeric_values),
        'median': statistics.median(numeric_values),
        'std': statistics.stdev(numeric_values) if len(numeric_values) > 1 else float('nan'),
        'ci_low': ci_low,
        'ci_high': ci_high,
        'p95': _percentile(numeric_values, 95),
        'p99': _percentile(numeric_values, 99)
    }


def plot_individual_metrics(metrics_data, system_names, save_dir="plots"):
    """
    Safely generate plots for each metric and save them to disk in headless mode.
    """
    os.makedirs(save_dir, exist_ok=True)
    colors = sns.color_palette("Set2", len(system_names))

    for metric_name, columns in metrics_data.items():
        fig, ax = plt.subplots(figsize=(10, 6))

        data = []
        systems = []
        for sys_idx, values in enumerate(columns):
            data.extend(values)
            systems.extend([system_names[sys_idx]] * len(values))

        df = pd.DataFrame({'System': systems, 'Value': data})

        sns.boxplot(
            x='System', y='Value', hue='System', data=df,
            palette=colors, ax=ax, legend=False
        )
        sns.stripplot(
            x='System', y='Value', data=df, color='black',
            size=4, jitter=True, ax=ax
        )

        ax.set_title(f"Distribution of '{metric_name}'", fontsize=22, fontweight='bold')
        ax.set_xlabel("System", fontsize=22, fontweight='bold')
        ax.set_ylabel(metric_name, fontsize=22, fontweight='bold')

        if "key generation" in metric_name.lower():
            positive_values = [value for column in columns for value in column if value > 0]
            if positive_values:
                ax.set_yscale('log')
                ax.set_ylim(bottom=max(min(positive_values) / 2, 1e-3))

        ax.tick_params(axis='both', labelsize=22)

        plt.tight_layout()
        output_path = os.path.join(save_dir, f"{metric_name.replace(' ', '_')}_distribution.png")
        plt.savefig(output_path, dpi=300)
        plt.close()
        print(f"Saved plot: {output_path}")


def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')


def print_progress(metrics, systems, data_entered):
    clear_console()
    print("Data Entry Progress:\n")
    if not metrics:
        print("No metrics entered yet.\n")
        return
    header = ["Metric/System"] + systems
    col_width = max(12, max(len(m) for m in metrics) + 2)
    system_col_widths = [max(8, len(s)+2) for s in systems]
    header_row = f"{header[0]:<{col_width}}"
    for i, sys_name in enumerate(systems):
        header_row += f"{sys_name:>{system_col_widths[i]}}"
    print(header_row)
    print("-" * (col_width + sum(system_col_widths)))
    for metric in metrics:
        row = f"{metric:<{col_width}}"
        for i, sys_name in enumerate(systems):
            mark = "✓" if data_entered.get(metric, {}).get(sys_name, False) else " "
            row += f"{mark:>{system_col_widths[i]}}"
        print(row)
    print("\n(✓ = data entered)")


def calculate_anova(columns, significance_level=0.05):
    total_n = sum(len(col) for col in columns)
    k = len(columns)

    all_values = [x for col in columns for x in col]
    grand_mean = sum(all_values) / total_n

    group_means = []
    ss_within = 0
    ss_between = 0

    for col in columns:
        if not col:
            group_means.append(None)
            continue
        n_j = len(col)
        mean_j = sum(col) / n_j
        group_means.append(mean_j)
        ss_within += sum((x - mean_j) ** 2 for x in col)
        ss_between += n_j * (mean_j - grand_mean) ** 2

    ss_total = sum((x - grand_mean) ** 2 for x in all_values)
    df_between = k - 1
    df_within = total_n - k
    ms_between = ss_between / df_between if df_between != 0 else float('nan')
    ms_within = ss_within / df_within if df_within != 0 else float('nan')
    f_stat = ms_between / ms_within if ms_within != 0 else float('inf')
    p_value = 1 - f.cdf(f_stat, df_between, df_within) if not math.isnan(f_stat) else float('nan')
    reject_null = p_value < significance_level

    return {
        "group_means": group_means,
        "group_stds": [statistics.stdev(col) if len(col) > 1 else float('nan') for col in columns],
        "grand_mean": grand_mean,
        "SSB": ss_between,
        "SSW": ss_within,
        "SST": ss_total,
        "df_between": df_between,
        "df_within": df_within,
        "MSB": ms_between,
        "MSW": ms_within,
        "F": f_stat,
        "p_value": p_value,
        "significance_level": significance_level,
        "reject_null": reject_null
    }


def calculate_cohens_d(group1, group2):
    """
    Calculate Cohen's d effect size between two groups.
    
    Cohen's d interpretation:
    - Small effect: |d| ≈ 0.2
    - Medium effect: |d| ≈ 0.5
    - Large effect: |d| ≈ 0.8+
    """
    n1, n2 = len(group1), len(group2)
    mean1, mean2 = sum(group1) / n1, sum(group2) / n2
    
    # Calculate pooled standard deviation
    var1 = sum((x - mean1) ** 2 for x in group1) / (n1 - 1) if n1 > 1 else 0
    var2 = sum((x - mean2) ** 2 for x in group2) / (n2 - 1) if n2 > 1 else 0
    pooled_std = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    
    # Cohen's d
    d = (mean1 - mean2) / pooled_std if pooled_std != 0 else float('inf')
    
    # Interpretation
    abs_d = abs(d)
    if abs_d < 0.2:
        interpretation = "negligible"
    elif abs_d < 0.5:
        interpretation = "small"
    elif abs_d < 0.8:
        interpretation = "medium"
    else:
        interpretation = "large"
    
    return d, interpretation


def run_tukey_hsd(columns, group_labels, alpha=0.05):
    data = []
    groups = []
    for label, col in zip(group_labels, columns):
        data.extend(col)
        groups.extend([label]*len(col))
    tukey = pairwise_tukeyhsd(endog=data, groups=groups, alpha=alpha)
    return tukey


def print_anova_results(metric_name, anova_results, group_labels, cohens_d_results=None):
    print(f"\nANOVA results for {metric_name}:")
    print("-" * 60)
    print(f"Groups: {group_labels}")
    print("Descriptive statistics per group:")
    print(f"{'Group':<15}{'N':<8}{'Mean':<12}{'Median':<12}{'Std':<12}{'95% CI':<26}{'p95':<12}{'p99':<12}")
    print("-" * 105)
    for label, values in zip(group_labels, anova_results['group_values']):
        stats = _describe_group(values)
        ci_text = f"[{_format_ms_value(stats['ci_low'])}, {_format_ms_value(stats['ci_high'])}]"
        print(
            f"{label:<15}{stats['n']:<8}{_format_ms_value(stats['mean']):<12}"
            f"{_format_ms_value(stats['median']):<12}{_format_ms_value(stats['std']):<12}"
            f"{ci_text:<26}{_format_ms_value(stats['p95']):<12}{_format_ms_value(stats['p99']):<12}"
        )
    print("\nANOVA Table:")
    print(f"{'Source':<15}{'SS':<15}{'df':<10}{'MS':<15}{'F':<10}")
    print("-" * 65)
    print(f"{'Between Groups':<15}{anova_results['SSB']:<15.4f}{anova_results['df_between']:<10}{anova_results['MSB']:<15.4f}{anova_results['F']:<10.4f}")
    print(f"{'Within Groups':<15}{anova_results['SSW']:<15.4f}{anova_results['df_within']:<10}{anova_results['MSW']:<15.4f}{'':<10}")
    print(f"{'Total':<15}{anova_results['SST']:<15.4f}{anova_results['df_between']+anova_results['df_within']:<10}{'':<15}{'':<10}")
    print(f"\nP-value: {anova_results['p_value']:.6f}")
    print(f"Reject Null Hypothesis: {anova_results['reject_null']}")
    
    # Print Cohen's d for pairwise comparisons
    if cohens_d_results:
        print("\nEffect Size (Cohen's d):")
        for comparison, (d, interpretation) in cohens_d_results.items():
            print(f"  {comparison}: d = {d:.4f} ({interpretation} effect)")


def print_tukey_results(tukey_result):
    df = pd.DataFrame(data=tukey_result._results_table.data[1:], columns=tukey_result._results_table.data[0])
    print("\nTukey HSD post-hoc test results:")
    print(df.to_string(index=False))


def input_columns(num_systems, systems, current_metric, data_entered, metrics):
    all_columns = []
    for i in range(num_systems):
        while True:
            print_progress(metrics, systems, data_entered)
            print(f"\nEnter values for system '{systems[i]}' for metric '{current_metric}':")
            current_column = []
            while True:
                line = input()
                if line.strip() == "":
                    if current_column:
                        break
                    else:
                        print("No data entered. Please enter at least one number for this system.")
                        continue
                try:
                    num = float(line.strip())
                    current_column.append(num)
                except ValueError:
                    print(f"Invalid number: {line}. Skipping.")
            all_columns.append(current_column)
            if current_metric not in data_entered:
                data_entered[current_metric] = {}
            data_entered[current_metric][systems[i]] = True
            print_progress(metrics, systems, data_entered)
            break
    return all_columns


def aggregate_decision(metrics_tukey_results, system_names):
    counts = {sys: {"win": 0, "loss": 0, "tie": 0} for sys in system_names}

    for metric_name, tukey in metrics_tukey_results.items():
        rows = tukey._results_table.data[1:]
        for row in rows:
            group1, group2, meandiff, p_adj, lower, upper, reject = row
            reject = bool(reject) if isinstance(reject, bool) else (reject == 'True' or reject == True)
            meandiff = float(meandiff)
            if reject:
                if meandiff > 0:
                    counts[group1]["win"] += 1
                    counts[group2]["loss"] += 1
                elif meandiff < 0:
                    counts[group1]["loss"] += 1
                    counts[group2]["win"] += 1
            else:
                counts[group1]["tie"] += 1
                counts[group2]["tie"] += 1

    scores = {sys: vals["win"] + 0.5 * vals["tie"] for sys, vals in counts.items()}
    ranking = sorted(scores.items(), key=lambda x: x[1], reverse=True)

    return counts, scores, ranking


def print_aggregate_summary(counts, scores, ranking):
    print("\n" + "="*70)
    print("Aggregate Decision-Support Summary Across All Metrics:\n")
    print(f"{'System':<15}{'Wins':<10}{'Losses':<10}{'Ties':<10}{'Score':<10}")
    print("-"*60)
    for sys in counts:
        print(f"{sys:<15}{counts[sys]['win']:<10}{counts[sys]['loss']:<10}{counts[sys]['tie']:<10}{scores[sys]:<10.2f}")
    print("\nOverall Ranking (Highest Score = Most Superior):")
    for idx, (sys, score) in enumerate(ranking, 1):
        print(f"{idx}. {sys} (Score: {score:.2f})")
    print("="*70 + "\n")


def main():
    """
    Automated ANOVA analysis for ECDSA vs ML-DSA-44
    Analyzes: Key Generation, Signing, Verification (from comparison-results)
    Plus: Smart Lock Verification (from IoT benchmarks)
    Plus: Mobile Key Generation & Signing (from mobile benchmarks)
    """
    print("="*70)
    print("Comprehensive ANOVA Analysis: ECDSA vs ML-DSA-44")
    print("="*70)
    print()
    
    # Setup paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    
    # Find the latest comparison results file
    comparison_dir = os.path.join(project_dir, "comparison-results")
    perf_folders = [f for f in os.listdir(comparison_dir) if f.startswith('performance-')]
    if not perf_folders:
        print(f"Error: No performance folders found in {comparison_dir}")
        return
    
    latest_folder = sorted(perf_folders)[-1]
    comparison_file = os.path.join(comparison_dir, latest_folder, "raw-data.json")
    
    pi_dir = os.path.join(comparison_dir, "pi-benchmark-results")
    pi_folders = [f for f in os.listdir(pi_dir) if f.startswith('pi-performance-')]
    
    if not pi_folders:
        print(f"Error: No pi-benchmark folders found in {pi_dir}")
        return
    
    latest_pi_folder = sorted(pi_folders)[-1]
    iot_file = os.path.join(pi_dir, latest_pi_folder, "raw-data.json")

    mobile_file = os.path.join(project_dir, "docker-emulation-benchmarks",
                              "mobile-benchmark-results", "mobile-results-mid-range.json")
    
    output_dir = os.path.join(project_dir, "anova-results", "comprehensive-analysis")
    os.makedirs(output_dir, exist_ok=True)
    
    # System names
    system_names = ["ECDSA", "ML-DSA-44", "Falcon-512"]
    metrics_data = {}
    
    # ========== Load Comparison Results Data ==========
    print(f"Loading comparison results from: {latest_folder}")
    if os.path.exists(comparison_file):
        with open(comparison_file, 'r') as f:
            comp_data = json.load(f)
        
        ecdsa_comp = comp_data['algorithms']['ecdsa']
        mldsa_comp = comp_data['algorithms']['dilithium2']
        falcon_comp = comp_data['algorithms']['falcon512']
        
        # Extract key generation, signing, and verification times
        metrics_data['Key Generation Time (ms)'] = [
            ecdsa_comp['keyGenTime'],
            mldsa_comp['keyGenTime'],
            falcon_comp['keyGenTime']
        ]
        metrics_data['Signing Time (ms)'] = [
            ecdsa_comp['signTime'],
            mldsa_comp['signTime'],
            falcon_comp['signTime']
        ]
        metrics_data['VC Verification Time (ms)'] = [
            ecdsa_comp['verifyTime'],
            mldsa_comp['verifyTime'],
            falcon_comp['verifyTime']
        ]
        
        print(f"✓ Loaded comparison data")
        print(f"  - Key Generation: {len(ecdsa_comp['keyGenTime'])} samples each")
        print(f"  - Signing: {len(ecdsa_comp['signTime'])} samples each")
        print(f"  - Verification: {len(ecdsa_comp['verifyTime'])} samples each")
    else:
        print(f"Warning: Comparison file not found at {comparison_file}")
    
    # ========== Load PI Benchmark Data ==========
    print(f"\nLoading PI benchmark data...")
    if os.path.exists(iot_file):
        with open(iot_file, 'r') as f:
            iot_data = json.load(f)
        
        ecdsa_iot = iot_data['algorithms']['ecdsa']['verifyTime']
        mldsa_iot = iot_data['algorithms']['dilithium2']['verifyTime']
        falcon_iot = iot_data['algorithms']['falcon512']['verifyTime']
        
        metrics_data['Smart Lock Verification (ms)'] = [
            ecdsa_iot,
            mldsa_iot,
            falcon_iot
        ]
        
        print(f"✓ Loaded PI benchmark data")
        print(f"  - Smart Lock Verification: {len(ecdsa_iot)} samples each")
    else:
        print(f"Warning: PI benchmark file not found at {iot_file}")
    
    # ========== Load Mobile Benchmark Data ==========
    print(f"\nLoading mobile benchmark data...")
    if os.path.exists(mobile_file):
        with open(mobile_file, 'r') as f:
            mobile_data = json.load(f)
        
        ecdsa_mobile = mobile_data['results']['ECDSA']
        mldsa_mobile = mobile_data['results']['ML-DSA-44']
        falcon_mobile = mobile_data['results']['Falcon-512']
        
        # Check if raw timing data exists (from updated benchmark)
        if 'times' in ecdsa_mobile.get('walletCreation', {}):
            metrics_data['Mobile Key Generation (ms)'] = [
                ecdsa_mobile['walletCreation']['times'],
                mldsa_mobile['walletCreation']['times'],
                falcon_mobile['walletCreation']['times']
            ]
            print(f"✓ Loaded mobile key generation data")
            print(f"  - Mobile Key Generation: {len(ecdsa_mobile['walletCreation']['times'])} samples each")
        else:
            print(f"  ⚠ Mobile key generation: raw timing data not available (re-run benchmark)")
        
        if 'times' in ecdsa_mobile.get('credentialSigning', {}):
            metrics_data['Mobile Signing (ms)'] = [
                ecdsa_mobile['credentialSigning']['times'],
                mldsa_mobile['credentialSigning']['times'],
                falcon_mobile['credentialSigning']['times']
            ]
            print(f"✓ Loaded mobile signing data")
            print(f"  - Mobile Signing: {len(ecdsa_mobile['credentialSigning']['times'])} samples each")
        else:
            print(f"  ⚠ Mobile signing: raw timing data not available (re-run benchmark)")
    else:
        print(f"Warning: Mobile benchmark file not found at {mobile_file}")
    
    if not metrics_data:
        print("Error: No data loaded. Exiting.")
        return
    
    print(f"\n{'='*70}")
    print(f"Comparing systems: {', '.join(system_names)}")
    print(f"Total metrics to analyze: {len(metrics_data)}")
    print(f"{'='*70}\n")
    
    # Generate plots
    print("Generating distribution plots...")
    plot_individual_metrics(metrics_data, system_names, save_dir=output_dir)
    print()
    
    # Perform ANOVA analysis
    print("### Performing ANOVA and Tukey HSD tests ###\n")
    
    metrics_tukey_results = {}
    
    for metric_name, columns in metrics_data.items():
        print("="*70)

        metric_df = build_metric_dataframe(metric_name, columns, system_names)
        if metric_name == 'Smart Lock Verification (ms)':
            # Focus smart-lock verification on the most relevant operational ranges.
            bins = [1.0, 5.0, 10.0, float('inf')]
            labels = ['1-5 ms', '5-10 ms', '> 10 ms']
        elif 'key generation' in metric_name.lower():
            # Key generation has a huge disparity (ECDSA/ML-DSA-44 are around 1ms, Falcon is 200+ms)
            bins = [0.0, 1.0, 2.0, 5.0, 10.0, 50.0, 150.0, 300.0, float('inf')]
            labels = ['<1 ms', '1-2 ms', '2-5 ms', '5-10 ms', '10-50 ms', '50-150 ms', '150-300 ms', '>300 ms']
        else:
            all_values = [v for col in columns for v in col]
            bins, labels = build_reasonable_bins_and_labels(all_values)

        print(f"Generating categorical bar chart for '{metric_name}' with bins:")
        print(f"  {labels}")
        plot_categorical_latency_barchart(metric_df, metric_name, bins, labels, save_dir=output_dir)

        anova_results = calculate_anova(columns)
        anova_results['group_values'] = columns
        
        # Calculate Cohen's d for all pairwise comparisons
        cohens_d_results = {} 
        for i in range(len(system_names)):
            for j in range(i + 1, len(system_names)):
                d, interpretation = calculate_cohens_d(columns[i], columns[j])
                comparison = f"{system_names[i]} vs {system_names[j]}"
                cohens_d_results[comparison] = (d, interpretation)
        
        print_anova_results(metric_name, anova_results, system_names, cohens_d_results)
        
        if anova_results['reject_null']:
            tukey_result = run_tukey_hsd(columns, system_names)
            print_tukey_results(tukey_result)
            metrics_tukey_results[metric_name] = tukey_result
        else:
            print("\nNo significant difference found among groups. Tukey HSD not performed.")
        print("\n" + "="*70 + "\n")
    
    if metrics_tukey_results:
        counts, scores, ranking = aggregate_decision(metrics_tukey_results, system_names)
        print_aggregate_summary(counts, scores, ranking)
    else:
        print("No post-hoc results available to aggregate.")
    
    print(f"\n✅ Analysis complete! Results saved to: {output_dir}")
    print(f"   - Plots: {output_dir}/*.png")
    print(f"\n📊 Metrics analyzed:")
    for i, metric in enumerate(metrics_data.keys(), 1):
        print(f"   {i}. {metric}")


if __name__ == "__main__":
    main()
