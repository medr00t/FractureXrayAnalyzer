from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from ultralytics import YOLO
import cv2
import numpy as np
import tempfile
import base64
import os

app = FastAPI()

# Allow CORS for local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = r"C:\Users\Med Amine EL\PycharmProjects\XRayFractureNet\ModelV4Yolo\best03022025.pt"
model = YOLO(model_path)

recovery_params = {
    'elbow positive': (200, 4000, 20, 40),
    'fingers positive': (50, 1500, 7, 15),
    'forearm fracture': (300, 6000, 25, 45),
    'humerus fracture': (300, 8000, 30, 50),
    'humerus': (300, 6000, 30, 50),
    'shoulder fracture': (300, 7000, 35, 55),
    'wrist positive': (100, 3000, 10, 20),
}

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # Save uploaded file to temp
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    temp.write(await file.read())
    temp.close()
    test_image = temp.name

    conf_start = 0.3
    conf_end = 0.002
    conf_step = -0.01
    conf_threshold = conf_start

    fracture_detected = False
    result = {
        "detected": False,
        "type": None,
        "recovery_time": None,
        "image_base64": None,
        "confidence": None
    }

    while conf_threshold >= conf_end and not fracture_detected:
        results = model(test_image, conf=conf_threshold)
        img = cv2.imread(test_image)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        detections = results[0].boxes.xyxy
        class_names = results[0].names
        if len(detections) > 0:
            for i, box in enumerate(detections):
                x_min, y_min, x_max, y_max = map(int, box[:4])
                fracture_type = class_names[int(results[0].boxes.cls[i].item())]
                width = x_max - x_min
                height = y_max - y_min
                area = width * height
                if fracture_type in recovery_params:
                    area_min, area_max, recov_min, recov_max = recovery_params[fracture_type]
                    if area <= area_min:
                        recovery_time = recov_min
                    elif area >= area_max:
                        recovery_time = recov_max
                    else:
                        recovery_time = recov_min + (area - area_min) / (area_max - area_min) * (recov_max - recov_min)
                    recovery_time = int(round(recovery_time))
                    if recovery_time == recov_min:
                        continue
                    else:
                        cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 0), 3)
                        result["detected"] = True
                        result["type"] = fracture_type
                        result["recovery_time"] = recovery_time
                        # Add a check for confidence
                        if hasattr(results[0].boxes, 'conf') and len(results[0].boxes.conf) > i:
                            result["confidence"] = float(results[0].boxes.conf[i].item())
                        else:
                            result["confidence"] = None
                        fracture_detected = True
                        # Save and encode the result image
                        result_path = test_image + "_result.jpg"
                        img_bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                        cv2.imwrite(result_path, img_bgr)
                        with open(result_path, "rb") as img_file:
                            result["image_base64"] = base64.b64encode(img_file.read()).decode("utf-8")
                        os.remove(result_path)
                        break
                else:
                    continue
        conf_threshold += conf_step

    os.remove(test_image)
    return JSONResponse(result)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)