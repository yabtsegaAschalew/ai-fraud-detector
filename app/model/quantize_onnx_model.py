from onnxruntime.quantization import quantize_dynamic, QuantType

       
onnx_model_path = '/Users/mac/Desktop/FRAUD DETECTION/app/model/artifacts/fraud_detector.onnx'
quantized_model_path = '/Users/mac/Desktop/FRAUD DETECTION/app/model/artifacts/fraud_detector_1bit.onnx'

          
quantize_dynamic(onnx_model_path, quantized_model_path, weight_type=QuantType.QUInt8)