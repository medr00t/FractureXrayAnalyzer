import albumentations as A
import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, List
import yaml

def create_augmentation_pipeline() -> A.Compose:
    """Create an augmentation pipeline specifically for X-ray images."""
    return A.Compose([
        A.OneOf([
            A.RandomRotate90(p=0.5),
            A.Rotate(limit=15, p=0.5),
        ], p=0.5),
        
        # Enhance contrast and visibility
        A.OneOf([
            A.RandomBrightnessContrast(
                brightness_limit=0.2,
                contrast_limit=0.3,
                p=0.5
            ),
            A.CLAHE(clip_limit=4.0, tile_grid_size=(8, 8), p=0.5),
        ], p=0.5),
        
        # Enhance edges and details
        A.OneOf([
            A.Sharpen(alpha=(0.2, 0.5), lightness=(0.5, 1.0), p=0.5),
            A.UnsharpMask(blur_limit=(3, 7), p=0.5),
        ], p=0.5),
        
        # Simulate noise and artifacts
        A.OneOf([
            A.GaussNoise(var_limit=(10.0, 50.0), p=0.3),
            A.MultiplicativeNoise(multiplier=(0.9, 1.1), p=0.3),
        ], p=0.3),
        
        # Simulate blur
        A.OneOf([
            A.GaussianBlur(blur_limit=(3, 5), p=0.3),
            A.MotionBlur(blur_limit=(3, 5), p=0.3),
        ], p=0.3),
        
        # Enhance bone structures
        A.OneOf([
            A.ImageCompression(quality_lower=80, quality_upper=100, p=0.3),
            A.Posterize(num_bits=6, p=0.3),
        ], p=0.3),
        
    ], bbox_params=A.BboxParams(format='yolo', label_fields=['class_labels']))

def load_annotations(yaml_path: str) -> dict:
    """Load YOLO annotations from yaml file."""
    with open(yaml_path, 'r') as f:
        return yaml.safe_load(f)

def augment_dataset(
    input_dir: str,
    output_dir: str,
    annotations_path: str,
    num_augmentations: int = 3
) -> None:
    """Augment dataset with specified number of variations per image."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Load annotations
    annotations = load_annotations(annotations_path)
    
    # Create augmentation pipeline
    transform = create_augmentation_pipeline()
    
    for img_path in input_path.glob("*.jpg"):
        # Read image
        image = cv2.imread(str(img_path))
        if image is None:
            print(f"Could not read image: {img_path}")
            continue
        
        # Get corresponding annotation file
        ann_path = img_path.with_suffix('.txt')
        if not ann_path.exists():
            print(f"No annotation file for: {img_path}")
            continue
        
        # Read annotations
        with open(ann_path, 'r') as f:
            bbox_lines = f.readlines()
        
        bboxes = []
        class_labels = []
        for line in bbox_lines:
            class_id, x, y, w, h = map(float, line.strip().split())
            bboxes.append([x, y, w, h])
            class_labels.append(class_id)
        
        # Generate augmentations
        for i in range(num_augmentations):
            # Apply augmentation
            transformed = transform(
                image=image,
                bboxes=bboxes,
                class_labels=class_labels
            )
            
            # Save augmented image
            output_name = f"{img_path.stem}_aug_{i}{img_path.suffix}"
            cv2.imwrite(str(output_path / output_name), transformed['image'])
            
            # Save augmented annotations
            with open(output_path / f"{img_path.stem}_aug_{i}.txt", 'w') as f:
                for bbox, class_id in zip(transformed['bboxes'], transformed['class_labels']):
                    f.write(f"{int(class_id)} {' '.join(map(str, bbox))}\n")
            
            print(f"Created augmentation {i+1} for {img_path.name}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Augment X-ray images and annotations for fracture detection")
    parser.add_argument("--input_dir", type=str, required=True, help="Input directory containing images and annotations")
    parser.add_argument("--output_dir", type=str, required=True, help="Output directory for augmented data")
    parser.add_argument("--annotations", type=str, required=True, help="Path to YOLO annotations yaml file")
    parser.add_argument("--num_aug", type=int, default=3, help="Number of augmentations per image")
    
    args = parser.parse_args()
    augment_dataset(args.input_dir, args.output_dir, args.annotations, args.num_aug)