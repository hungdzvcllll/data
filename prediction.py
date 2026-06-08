from joblib import load
import pandas as pd
import shap
import numpy as np



best_model = load("student_examscore_model.joblib")
model = best_model.named_steps["model"]

explainer = shap.TreeExplainer(model)
df=pd.read_csv('student_performance.csv')
df=df.drop(['FinalGrade','ExamScore'], axis=1)
sample=df.iloc[[19]]  #thay dữ liêụ của ae vào đây
shap_values = explainer.shap_values(sample)

idx = np.argsort(shap_values[0])

worst_features = idx[:3] #3 thuộc tính tệ nhất ảnh hưởng điểm số
print(worst_features)
print(shap_values)