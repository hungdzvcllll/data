from joblib import load
import pandas as pd
import shap
import numpy as np



best_model = load("student_examscore_model.joblib")
model = best_model.named_steps["model"]

explainer = shap.TreeExplainer(model)
df=pd.read_csv('student_performance.csv')
df=df.drop(['FinalGrade','ExamScore'], axis=1)
sample=df.iloc[[19]]  
shap_values = explainer.shap_values(sample)
idx = np.argsort(shap_values[0])

worst_features = idx[:3]
print(worst_features)
shap.waterfall_plot(
    shap.Explanation(
        values=shap_values[0],
        base_values=explainer.expected_value,
        data=sample.iloc[0],
        feature_names=sample.columns
    )
)