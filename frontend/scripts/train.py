import torch
from ultralytics import YOLO
import yaml
from pathlib import Path
import argparse
import albumentations as A
from typing import Dict, Any

def prepare_training_config(data_yaml: str, epochs: int = 100) -> dict:
    """Prepare training configuration for fine-tuning."""
    with open(data_yaml, 'r') as f:
        data_config = yaml.safe_load(f)
    
    return {
        'data': data_yaml,
        'epochs': epochs,
        'patience': 50,
        'batch': 16,
        'imgsz': 640,
        'optimizer': 'AdamW',
        'lr0': 0.0005,
        'lrf': 0.00001,
        'momentum': 0.937,
        'weight_decay': 0.0005,
        'warmup_epochs': 3.0,
        'warmup_momentum': 0.8,
        'warmup_bias_lr': 0.1,
        'box': 7.5,  # Increased box loss weight for better localization
        'cls': 0.5,
        'dfl': 1.5,
        'fl_gamma': 2.0,  # Focal loss gamma for handling hard examples
        'label_smoothing': 0.0,
        'nbs': 64,
        'hsv_h': 0.015,  # Color augmentation
        'hsv_s': 0.7,
        'hsv_v': 0.4,
        'degrees': 15.0,  # Geometric augmentation
        'translate': 0.1,
        'scale': 0.5,
        'shear': 0.0,
        'perspective': 0.0,
        'flipud': 0.0,
        'fliplr': 0.5,
        'mosaic': 0.0,  # Disable mosaic as it may confuse fracture patterns
        'mixup': 0.0,
        'copy_paste': 0.0,
        'auto_augment': 'randaugment',
    }

def create_model_callbacks() -> Dict[str, Any]:
    """Create custom callbacks for model training."""
    class FractureDetectionCallback:
        def on_train_start(self):
            print("Starting fracture detection training...")
        
        def on_train_epoch_end(self, epoch: int, metrics: Dict[str, float]):
            print(f"Epoch {epoch} completed:")
            print(f"  mAP50: {metrics.get('metrics/mAP50', 0):.3f}")
            print(f"  mAP50-95: {metrics.get('metrics/mAP50-95', 0):.3f}")
            print(f"  Precision: {metrics.get('metrics/precision', 0):.3f}")
            print(f"  Recall: {metrics.get('metrics/recall', 0):.3f}")
    
    return {"training": FractureDetectionCallback()}

def fine_tune_model(
    pretrained_weights: str,
    data_yaml: str,
    output_dir: str,
    epochs: int = 100
) -> None:
    """Fine-tune YOLOv8 model for fracture detection."""
    # Load pretrained model
    model = YOLO(pretrained_weights)
    
    # Prepare output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Get training configuration
    training_args = prepare_training_config(data_yaml, epochs)
    
    # Add custom callbacks
    callbacks = create_model_callbacks()
    
    # Configure model for fracture detection
    model.add_callback("on_train_start", callbacks["training"].on_train_start)
    model.add_callback("on_train_epoch_end", callbacks["training"].on_train_epoch_end)
    
    # Start training with focal loss and class weights
    results = model.train(
        **training_args,
        project=str(output_path),
        name='fracture_detection_model',
        rect=True,  # Enable rectangular training for better small object detection
        multi_scale=True,  # Enable multi-scale training
        overlap_mask=True,  # Enable mask overlap for better segmentation
        mask_ratio=4,  # Increase mask resolution
        device=0 if torch.cuda.is_available() else 'cpu'
    )
    
    # Validate the model with lower confidence threshold
    metrics = model.val(conf=0.3)  # Lower confidence threshold for validation
    
    print("\nTraining completed!")
    print(f"Results saved to: {output_path / 'fracture_detection_model'}")
    print("\nValidation Metrics:")
    print(f"mAP50: {metrics.box.map50:.3f}")
    print(f"mAP50-95: {metrics.box.map:.3f}")
    print(f"mAP75: {metrics.box.map75:.3f}")  # Higher IoU threshold metric
    print(f"Precision: {metrics.box.precision:.3f}")
    print(f"Recall: {metrics.box.recall:.3f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8 for fracture detection")
    parser.add_argument("--weights", type=str, required=True, help="Path to pretrained weights")
    parser.add_argument("--data", type=str, required=True, help="Path to data.yaml file")
    parser.add_argument("--output", type=str, required=True, help="Output directory for trained model")
    parser.add_argument("--epochs", type=int, default=100, help="Number of training epochs")
    
    args = parser.parse_args()
    fine_tune_model(args.weights, args.data, args.output, args.epochs)