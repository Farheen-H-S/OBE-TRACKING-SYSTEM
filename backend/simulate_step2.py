
def simulate_step2():
    # Data extracted from the user's image
    # Each list represents a survey's averages for PO1-PO7 and PSO1-PSO3 (Cols 1-10)
    surveys = [
        {"name": "Expert Talk on Resume Making", "scores": [2.49, 3.00, 2.77, 3.00, 3.00, 3.00, 2.84, 3.00, 3.00, 3.00]},
        {"name": "Expert Talk on Full Stack Development", "scores": [2.71, 3.00, 2.76, 3.00, 3.00, 3.00, 2.80, 3.00, 3.00, 3.00]},
        {"name": "Expert Talk On Project Development", "scores": [2.64, 3.00, 2.72, 3.00, 3.00, 3.00, 2.88, 3.00, 3.00, 3.00]},
        {"name": "Expert Talk on Cyber Crime & its awareness", "scores": [2.67, 3.00, 2.84, 3.00, 3.00, 3.00, 2.77, 3.00, 3.00, 3.00]},
        {"name": "Expert Talk on Personality Development...", "scores": [2.89, 3.00, 2.72, 3.00, 3.00, 3.00, 2.83, 3.00, 3.00, 3.00]},
        {"name": "Expert Talk on Cyber Security", "scores": [2.74, 3.00, 2.81, 3.00, 3.00, 3.00, 2.86, 3.00, 3.00, 3.00]},
    ]

    expected_avg = [2.69, 3.00, 2.77, 3.00, 3.00, 3.00, 2.83, 3.00, 3.00, 3.00]

    num_surveys = len(surveys)
    num_cols = 10
    calculated_avg = []

    print(f"Number of Surveys: {num_surveys}")
    print("\n--- Calculated Grand Averages (Step 2) ---")
    
    for col in range(num_cols):
        col_sum = sum(s["scores"][col] for s in surveys)
        avg = round(col_sum / num_surveys, 2)
        calculated_avg.append(avg)
        
        status = "MATCH" if avg == expected_avg[col] else f"MISMATCH (Expected {expected_avg[col]})"
        label = f"PO {col+1}" if col < 7 else f"PSO {col-6}"
        print(f"{label}: {avg:.2f} -> {status}")

if __name__ == "__main__":
    simulate_step2()
