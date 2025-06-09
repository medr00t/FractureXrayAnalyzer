import os
from pathlib import Path
import torch
from ultralytics import YOLO
import yaml
import logging
from typing import Dict, Any, Optional
import mlflow
from datetime import datetime

class FractureDetectionTrainer:
    def __init__(
        self,
        data_yaml: str,
        output_dir: str,
        pretrained_weights: Optional[str] = None,
        experiment_name: str = "fracture_detection"
    ):
        self.data_yaml = data_yaml
        self.output_dir = Path(output_dir)
        self.pretrained_weights = pretrained_weights
        self.experiment_name = experiment_name
        
        # Set up logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Initialize MLflow
        mlflow.set_experiment(experiment_name)
        
        # Load configuration
        self.load_config()
        
        # Create output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def load_config(self) -> None:
        """Load and validate training configuration."""
        with open(self.data_yaml, 'r') as f:
            self.config = yaml.safe_load(f)
        
        required_keys = ['path', 'train', 'val', 'names', 'nc']
        missing_keys = [key for key in required_keys if key not in self.config]
        if missing_keys:
            raise ValueError(f"Missing required keys in config: {missing_keys}")

    def prepare_training_config(self) -> Dict[str, Any]:
        """Prepare optimized training configuration."""
        return {
            'data': self.data_yaml,
            'epochs': 300,  # Increased epochs for better convergence
            'patience': 50,  # Early stopping patience
            'batch': 16,
            'imgsz': 640,
            'optimizer': 'AdamW',  # Better optimizer for medical imaging
            'lr0': 0.0005,
            'lrf': 0.00001,
            'momentum': 0.937,
            'weight_decay': 0.0005,
            'warmup_epochs': 5.0,  # Increased warmup
            'warmup_momentum': 0.8,
            'warmup_bias_lr': 0.1,
            'box': 7.5,  # Increased box loss weight
            'cls': 0.5,
            'dfl': 1.5,
            'fl_gamma': 2.0,  # Focal loss gamma
            'label_smoothing': 0.0,
            'nbs': 64,
            'hsv_h': 0.015,
            'hsv_s': 0.7,
            'hsv_v': 0.4,
            'degrees': 15.0,
            'translate': 0.1,
            'scale': 0.5,
            'shear': 0.0,
            'perspective': 0.0,
            'flipud': 0.0,
            'fliplr': 0.5,
            'mosaic': 0.0,  # Disabled for medical imaging
            'mixup': 0.0,
            'copy_paste': 0.0,
            'auto_augment': 'randaugment',
        }

    def create_callbacks(self) -> Dict[str, Any]:
        """Create training callbacks."""
        class MLflowCallback:
            def on_train_start(self):
                mlflow.start_run()
                mlflow.log_params(self.trainer.args)
            
            def on_train_epoch_end(self, epoch: int, metrics: Dict[str, float]):
                for key, value in metrics.items():
                    mlflow.log_metric(key, value, step=epoch)
            
            def on_train_end(self, metrics: Dict[str, float]):
                mlflow.log_metrics(metrics)
                mlflow.end_run()
        
        class MetricsCallback:
            def __init__(self, logger):
                self.logger = logger
            
            def on_train_epoch_end(self, epoch: int, metrics: Dict[str, float]):
                self.logger.info(f"Epoch {epoch} completed:")
                self.logger.info(f"  mAP50: {metrics.get('metrics/mAP50', 0):.3f}")
                self.logger.info(f"  mAP50-95: {metrics.get('metrics/mAP50-95', 0):.3f}")
                self.logger.info(f"  Precision: {metrics.get('metrics/precision', 0):.3f}")
                self.logger.info(f"  Recall: {metrics.get('metrics/recall', 0):.3f}")
        
        return {
            "mlflow": MLflowCallback(),
            "metrics": MetricsCallback(self.logger)
        }

    def train(self) -> None:
        """Train the fracture detection model."""
        try:
            self.logger.info("Starting fracture detection training...")
            
            # Initialize model
            if self.pretrained_weights:
                model = YOLO(self.pretrained_weights)
                self.logger.info(f"Loaded pretrained weights from: {self.pretrained_weights}")
            else:
                model = YOLO('yolov8x.pt')  # Use largest YOLOv8 model
                self.logger.info("Using default YOLOv8x weights")
            
            # Get training configuration
            training_args = self.prepare_training_config()
            
            # Add callbacks
            callbacks = self.create_callbacks()
            for callback in callbacks.values():
                model.add_callback("on_train_start", callback.on_train_start)
                model.add_callback("on_train_epoch_end", callback.on_train_epoch_end)
            
            # Start training
            self.logger.info("Training with configuration:")
            for key, value in training_args.items():
                self.logger.info(f"  {key}: {value}")
            
            results = model.train(
                **training_args,
                project=str(self.output_dir),
                name=f'fracture_detection_{datetime.now().strftime("%Y%m%d_%H%M%S")}',
                exist_ok=True,
                device=0 if torch.cuda.is_available() else 'cpu'
            )
            
            # Validate with lower confidence threshold
            self.logger.info("\nRunning validation with lower confidence threshold...")
            metrics = model.val(conf=0.3)
            
            self.logger.info("\nTraining completed!")
            self.logger.info(f"Results saved to: {self.output_dir}")
            self.logger.info("\nValidation Metrics:")
            self.logger.info(f"mAP50: {metrics.box.map50:.3f}")
            self.logger.info(f"mAP50-95: {metrics.box.map:.3f}")
            self.logger.info(f"Precision: {metrics.box.precision:.3f}")
            self.logger.info(f"Recall: {metrics.box.recall:.3f}")
            
        except Exception as e:
            self.logger.error(f"Error during training: {str(e)}")
            raise

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Train YOLOv8 for fracture detection on large dataset")
    parser.add_argument("--data", type=str, required=True, help="Path to data.yaml file")
    parser.add_argument("--weights", type=str, help="Path to pretrained weights")
    parser.add_argument("--output", type=str, required=True, help="Output directory for trained model")
    parser.add_argument("--experiment", type=str, default="fracture_detection", help="MLflow experiment name")
    
    args = parser.parse_args()
    
    trainer = FractureDetectionTrainer(
        data_yaml=args.data,
        output_dir=args.output,
        pretrained_weights=args.weights,
        experiment_name=args.experiment
    )
    
    trainer.train()