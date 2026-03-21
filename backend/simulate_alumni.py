
def simulate_alumni():
    # Data extracted from the fifth image (Alumni Feedback)
    # 2 survey results labled (1) and (2)
    surveys = [
        [2.44, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00],
        [3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 2.88, 3.00, 3.00, 3.00],
    ]

    # Step 2/3: Simple average of these two
    num_surveys = len(surveys)
    num_cols = 10
    calculated_avg = []

    print(f"Number of Surveys for Alumni Feedback: {num_surveys}")
    print("\n--- Calculated Alumni Average (Step 2/3) ---")
    
    for col in range(num_cols):
        col_sum = sum(s[col] for s in surveys)
        avg = round(col_sum / num_surveys, 2)
        calculated_avg.append(avg)
        
        label = f"PO {col+1}" if col < 7 else f"PSO {col-6}"
        print(f"{label}: {avg:.2f}")

if __name__ == "__main__":
    simulate_alumni()
