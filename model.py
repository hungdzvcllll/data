import os

from matplotlib.pylab import uniform
import pandas as pd
import shap
from sklearn.model_selection import RandomizedSearchCV, train_test_split
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler, StandardScaler
from sklearn.svm import SVC, SVR
from xgboost import XGBClassifier, XGBRegressor
from sklearn.metrics import accuracy_score, classification_report, mean_absolute_error, mean_squared_error, r2_score
import matplotlib.pyplot as plt
import numpy as np
from scipy.stats import uniform, randint
from sklearn.metrics import precision_recall_fscore_support
from joblib import dump
df=pd.read_csv('student_performance.csv')
df=df.dropna()
X = df.drop(['FinalGrade','ExamScore'], axis=1)  
y = df['ExamScore']
x_train, x_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

os.makedirs("boxplots", exist_ok=True)
os.makedirs("barplots", exist_ok=True)

for col in df.columns:

    # ===== BOXPLOT =====
    if pd.api.types.is_numeric_dtype(df[col]):
        plt.figure(figsize=(6, 4))
        plt.boxplot(df[col].dropna())
        plt.title(f"Boxplot - {col}")
        plt.ylabel(col)

        plt.savefig(f"boxplots/{col}_boxplot.png",
                    bbox_inches="tight")
        plt.close()

    # ===== BAR CHART =====
    plt.figure(figsize=(8, 4))

    value_counts = df[col].value_counts()

    plt.bar(value_counts.index.astype(str),
            value_counts.values)

    plt.title(f"Bar Chart - {col}")
    plt.xlabel(col)
    plt.ylabel("Count")

    plt.xticks(rotation=45)

    plt.savefig(f"barplots/{col}_barplot.png",
                bbox_inches="tight")
    plt.close()

print("Đã lưu toàn bộ ảnh.")
pipe = Pipeline([
    ("scaler", RobustScaler()),
    ("model", SVR())
])

# =========================
# Param grid cho nhiều model
# =========================

param_distributions = [

    # =====================
    # SVM
    # =====================
    {
        "model": [SVR()],
        "model__C": [0.1,1,5,10],
        "model__gamma": ["scale", "auto", 0.1, 0.01],
        "model__kernel": ["rbf", "linear"]
    },

    # =====================
    # KNN
    # =====================
    {    
       "model": [KNeighborsRegressor()],
       "model__n_neighbors": randint(3, 31),
      "model__weights": ["uniform", "distance"],
        "model__metric": ["euclidean", "manhattan"]
    },

    # =====================
    # XGBoost
    # =====================
    {
        "scaler": ["passthrough"],

        "model": [
            XGBRegressor(
                objective="reg:squarederror",
                random_state=42
            )
        ],

        "model__n_estimators": randint(100,500),
        "model__max_depth": randint(3,10),
        "model__learning_rate": uniform(0.01,0.1),
        "model__subsample": uniform(0.4,0.6),
        'model__colsample_bytree': uniform(0.4, 0.6),   # Feature sampling
        'model__gamma': uniform(0, 5)   
    }
]

# =========================
# RandomizedSearchCV
# =========================

search = RandomizedSearchCV(
    estimator=pipe,
    param_distributions=param_distributions,
    n_iter=80,
    cv=5,
    scoring="neg_mean_absolute_error",
    verbose=2,
    n_jobs=-1,
    random_state=42
)

search.fit(x_train, y_train)
best_model = search.best_estimator_
model = best_model.named_steps["model"]

explainer = shap.TreeExplainer(model)

sample = x_test.iloc[[0]]

shap_values = explainer.shap_values(sample)

shap.waterfall_plot(
    shap.Explanation(
        values=shap_values[0],
        base_values=explainer.expected_value,
        data=sample.iloc[0],
        feature_names=sample.columns
    )
)
dump(best_model, "student_examscore_model.joblib")
y_pred = search.predict(x_test)
mae = mean_absolute_error(y_test, y_pred)
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)
print(r2)
print("MAE:", mae)
print("MSE:", mse)
def score_to_grade(score):
    if score >= 85:
        return 0
    elif score >= 70:
        return 1
    elif score >= 55:
        return 2
    else:
        return 3

pred_grade = np.array([
    score_to_grade(x)
    for x in y_pred
])

true_grade = np.array([
    score_to_grade(x)
    for x in y_test
])
acc = accuracy_score(
    true_grade,
    pred_grade
)

print("Grade Accuracy:", acc)
precision, recall, f1, support = (
    precision_recall_fscore_support(
        true_grade,
        pred_grade,
        labels=[0,1,2,3]
    )
)
os.makedirs(
    "metrics_plots",
    exist_ok=True
)
x = np.arange(4)
width = 0.35

plt.figure(figsize=(8,5))

plt.bar(
    x - width/2,
    precision,
    width,
    label="Precision"
)

plt.bar(
    x + width/2,
    recall,
    width,
    label="Recall"
)

plt.xticks(
    x,
    ['0','1','2','3']
)

plt.xlabel("FinalGrade")
plt.ylabel("Score")
plt.title("Precision and Recall by Grade")
plt.ylim(0,1)

plt.legend()

plt.savefig(
    "metrics_plots/precision_recall_by_grade.png",
    bbox_inches="tight"
)

plt.close()