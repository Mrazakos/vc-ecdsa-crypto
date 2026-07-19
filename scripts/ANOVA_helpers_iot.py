import math
import os
import json
from scipy.stats import f
from statsmodels.stats.multicomp import pairwise_tukeyhsd
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import statistics


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
        ax.tick_params(axis='both', labelsize=22)

        if 'key generation' in metric_name.lower():
            positive_values = [value for column in columns for value in column if value > 0]
            if positive_values:
                ax.set_yscale('log')
                ax.set_ylim(bottom=max(min(positive_values) / 2, 1e-3))

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


def run_tukey_hsd(columns, group_labels, alpha=0.05):
    data = []
    groups = []
    for label, col in zip(group_labels, columns):
        data.extend(col)
        groups.extend([label]*len(col))
    tukey = pairwise_tukeyhsd(endog=data, groups=groups, alpha=alpha)
    return tukey


def print_anova_results(metric_name, anova_results, group_labels):
    print(f"\nANOVA results for {metric_name}:")
    print("-" * 60)
    print(f"Groups: {group_labels}")
    print("Means and standard deviations per group:")
    for label, mean, std in zip(group_labels, anova_results['group_means'], anova_results['group_stds']):
        print(f"  {label}: Mean = {mean:.4f}, Std = {std:.4f}")
    print("\nANOVA Table:")
    print(f"{'Source':<15}{'SS':<15}{'df':<10}{'MS':<15}{'F':<10}")
    print("-" * 65)
    print(f"{'Between Groups':<15}{anova_results['SSB']:<15.4f}{anova_results['df_between']:<10}{anova_results['MSB']:<15.4f}{anova_results['F']:<10.4f}")
    print(f"{'Within Groups':<15}{anova_results['SSW']:<15.4f}{anova_results['df_within']:<10}{anova_results['MSW']:<15.4f}{'':<10}")
    print(f"{'Total':<15}{anova_results['SST']:<15.4f}{anova_results['df_between']+anova_results['df_within']:<10}{'':<15}{'':<10}")
    print(f"\nP-value: {anova_results['p_value']:.6f}")
    print(f"Reject Null Hypothesis: {anova_results['reject_null']}")


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
            group1, group2, meandiff, lower, upper, reject, p_adj = row
            reject = True if reject == 'True' else False
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
    Automated ANOVA analysis for IoT benchmark results
    Compares ECDSA vs ML-DSA-44 on verification and total access times
    """
    print("="*70)
    print("IoT Benchmark ANOVA Analysis: ECDSA vs ML-DSA-44")
    print("="*70)
    print()
    
    # Setup paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(script_dir)
    iot_file = os.path.join(project_dir, "docker-emulation-benchmarks", 
                           "iot-benchmark-results", "iot-benchmark-results.json")
    output_dir = os.path.join(project_dir, "anova-results", "iot-analysis")
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Load IoT benchmark data
    print("Loading IoT benchmark data...")
    if not os.path.exists(iot_file):
        print(f"Error: IOT benchmark file not found at {iot_file}")
        return
    
    with open(iot_file, 'r') as f:
        data = json.load(f)
    
    print(f"✓ Loaded IoT benchmark data")
    print()
    
    # Extract data for ECDSA and ML-DSA-44
    system_names = ["ECDSA", "ML-DSA-44"]
    
    ecdsa_data = data['algorithms']['ECDSA']['smartLock']
    mldsa_data = data['algorithms']['ML-DSA-44']['smartLock']
    
    # Prepare metrics data
    metrics_data = {
        'Verification Time (ms)': [
            ecdsa_data['verificationTimes'],
            mldsa_data['verificationTimes']
        ],
        'Total Access Time (ms)': [
            ecdsa_data['totalTimes'],
            mldsa_data['totalTimes']
        ]
    }
    
    print(f"Comparing systems: {', '.join(system_names)}")
    print(f"Metrics: {', '.join(metrics_data.keys())}")
    print(f"\nSample sizes:")
    print(f"  - ECDSA verification: {len(ecdsa_data['verificationTimes'])} samples")
    print(f"  - ML-DSA-44 verification: {len(mldsa_data['verificationTimes'])} samples")
    print(f"  - ECDSA total access: {len(ecdsa_data['totalTimes'])} samples")
    print(f"  - ML-DSA-44 total access: {len(mldsa_data['totalTimes'])} samples")
    print()
    
    # Generate plots
    print("Generating distribution plots...")
    plot_individual_metrics(metrics_data, system_names, save_dir=output_dir)
    print()
    
    # Perform ANOVA analysis
    print("\n### Performing ANOVA and Tukey HSD tests ###\n")
    
    metrics_tukey_results = {}
    
    for metric_name, columns in metrics_data.items():
        print("="*70)
        anova_results = calculate_anova(columns)
        print_anova_results(metric_name, anova_results, system_names)
        
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


if __name__ == "__main__":
    main()
