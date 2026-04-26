from onnxmltools import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType
import joblib

                    
xgb = joblib.load('/Users/mac/Desktop/FRAUD DETECTION/app/model/artifacts/xgb_model.pkl')

                         
feature_dim = len(xgb.get_booster().feature_names)
initial_type = [('float_input', FloatTensorType([None, feature_dim]))]

                 
onnx_model = convert_xgboost(xgb, initial_types=initial_type)
onnx_model_path = '/Users/mac/Desktop/FRAUD DETECTION/app/model/artifacts/fraud_detector.onnx'
with open(onnx_model_path, 'wb') as f:
    f.write(onnx_model.SerializeToString())