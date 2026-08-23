def calculate_priority(
    severity: float,
    urgency: float,
    safety_risk: float,
    public_impact: float,
) -> float:

    score = (
        0.30 * severity
        + 0.25 * urgency
        + 0.25 * safety_risk
        + 0.20 * public_impact
    )

    return round(score, 2)


def get_department(category: str) -> str:

    departments = {
        "road_damage": "Public Works",
        "garbage": "Sanitation",
        "street_light": "Electricity Department",
        "naked_wires": "Electricity Department",
        "power_outage": "Electricity Department",
        "water": "Water Department",
        "crime": "Police",
        "fire": "Emergency Services",
    }

    return departments.get(category, "Municipal Administration")
