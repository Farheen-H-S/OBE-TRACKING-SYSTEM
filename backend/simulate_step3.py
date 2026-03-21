
def simulate_step3():
    # Data extracted from the new image (Overall Curricular and Extra Curricular Activities)
    # 8 survey results for PO1-PO7 and PSO1-PSO3
    surveys = [
        [2.69, 3.00, 2.77, 3.00, 3.00, 3.00, 2.83, 3.00, 3.00, 3.00],
        [2.65, 3.00, 2.83, 3.00, 3.00, 3.00, 2.80, 3.00, 3.00, 3.00],
        [2.71, 3.00, 3.00, 3.00, 3.00, 3.00, 2.43, 3.00, 3.00, 3.00],
        [2.71, 3.00, 3.00, 3.00, 3.00, 3.00, 2.43, 3.00, 3.00, 3.00],
        [2.75, 3.00, 2.75, 3.00, 3.00, 3.00, 2.85, 3.00, 3.00, 3.00],
        [2.75, 3.00, 2.75, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00],
        [2.80, 3.00, 2.85, 3.00, 3.00, 3.00, 2.98, 3.00, 3.00, 3.00],
        [2.83, 3.00, 2.83, 3.00, 3.00, 3.00, 2.85, 3.00, 3.00, 3.00],
    ]

    expected_avg = [2.74, 3.00, 2.85, 3.00, 3.00, 3.00, 2.77, 3.00, 3.00, 3.00]

    num_surveys = len(surveys)
    num_cols = 10
    calculated_avg = []

    print(f"Number of Surveys in Category: {num_surveys}")
    print("\n--- Calculated Category Average (Step 3) ---")
    
    for col in range(num_cols):
        col_sum = sum(s[col] for s in surveys)
        avg = round(col_sum / num_surveys, 2)
        calculated_avg.append(avg)
        
        status = "MATCH" if avg == expected_avg[col] else f"MISMATCH (Expected {expected_avg[col]})"
        label = f"PO {col+1}" if col < 7 else f"PSO {col-6}"
        print(f"{label}: {avg:.2f} -> {status}")

if __name__ == "__main__":
    simulate_step3()
