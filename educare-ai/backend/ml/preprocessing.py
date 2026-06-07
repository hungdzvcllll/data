"""Feature column order must match training: model.py X columns."""
FEATURE_COLUMNS = [
    "StudyHours",
    "Attendance",
    "Resources",
    "Extracurricular",
    "Motivation",
    "Internet",
    "Gender",
    "Age",
    "LearningStyle",
    "OnlineCourses",
    "Discussions",
    "AssignmentCompletion",
    "EduTech",
    "StressLevel",
]


def normalize_features(raw: dict) -> dict:
    """Normalize incoming feature keys to training column names."""
    mapping = {
        "studyHours": "StudyHours",
        "attendance": "Attendance",
        "resources": "Resources",
        "extracurricular": "Extracurricular",
        "motivation": "Motivation",
        "internet": "Internet",
        "gender": "Gender",
        "age": "Age",
        "learningStyle": "LearningStyle",
        "onlineCourses": "OnlineCourses",
        "discussions": "Discussions",
        "assignmentCompletion": "AssignmentCompletion",
        "eduTech": "EduTech",
        "stressLevel": "StressLevel",
    }

    normalized = {}
    for key, value in raw.items():
        if key in FEATURE_COLUMNS:
            normalized[key] = float(value)
        elif key in mapping:
            normalized[mapping[key]] = float(value)

    missing = [c for c in FEATURE_COLUMNS if c not in normalized]
    if missing:
        raise ValueError(f"Missing features: {', '.join(missing)}")

    return {col: normalized[col] for col in FEATURE_COLUMNS}


def features_to_row(features: dict) -> list:
    normalized = normalize_features(features)
    return [normalized[col] for col in FEATURE_COLUMNS]
