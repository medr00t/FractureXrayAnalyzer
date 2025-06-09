import os
import glob
from pathlib import Path
import shutil
import random
import cv2
import numpy as np
from typing import Tuple, List, Dict
import yaml

class XrayDatasetLoader:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.train_dir = self.base_dir / 'train'
        self.valid_dir = self.base_dir / 'valid'
        self.test_dir = self.base_dir / 'test'
        
        # Create directories if they don't exist
        for dir_path in [self.train_dir, self.valid_dir, self.test_dir]:
            dir_path.mkdir(parents=True, exist_ok=True)
            (dir_path / 'images').mkdir(exist_ok=True)
            (dir_path / 'labels').mkdir(exist_ok=True)

    def load_and_split_dataset(
        self,
        source_dir: str,
        split_ratio: Tuple[float, float, float] = (0.7, 0.2, 0.1)
    ) -> Dict[str, int]:
        """
        Load X-ray images and annotations, split into train/valid/test sets.
        
        Args:
            source_dir: Directory containing images and YOLO format annotations
            split_ratio: Tuple of (train, validation, test) ratios
            
        Returns:
            Dict with count of images in each split
        """
        # Validate split ratio
        if sum(split_ratio) != 1.0:
            raise ValueError("Split ratios must sum to 1.0")
        
        # Get all image files
        image_files = []
        for ext in ['*.jpg', '*.jpeg', '*.png']:
            image_files.extend(glob.glob(os.path.join(source_dir, ext)))
        
        # Shuffle files for random split
        random.shuffle(image_files)
        
        # Calculate split indices
        n_total = len(image_files)
        n_train = int(n_total * split_ratio[0])
        n_valid = int(n_total * split_ratio[1])
        
        # Split files
        train_files = image_files[:n_train]
        valid_files = image_files[n_train:n_train + n_valid]
        test_files = image_files[n_train + n_valid:]
        
        # Copy files to respective directories
        splits = {
            'train': (train_files, self.train_dir),
            'valid': (valid_files, self.valid_dir),
            'test': (test_files, self.test_dir)
        }
        
        counts = {}
        for split_name, (files, target_dir) in splits.items():
            count = 0
            for img_path in files:
                # Get corresponding annotation file
                ann_path = os.path.splitext(img_path)[0] + '.txt'
                if not os.path.exists(ann_path):
                    continue
                
                # Copy image and annotation
                img_filename = os.path.basename(img_path)
                ann_filename = os.path.basename(ann_path)
                
                shutil.copy2(img_path, target_dir / 'images' / img_filename)
                shutil.copy2(ann_path, target_dir / 'labels' / ann_filename)
                count += 1
            
            counts[split_name] = count
        
        return counts

    def verify_dataset(self) -> Dict[str, Dict[str, int]]:
        """
        Verify dataset integrity and return statistics.
        """
        stats = {}
        for split in ['train', 'valid', 'test']:
            split_dir = getattr(self, f'{split}_dir')
            
            # Count images and annotations
            n_images = len(list((split_dir / 'images').glob('*.[jp][pn][g]')))
            n_labels = len(list((split_dir / 'labels').glob('*.txt')))
            
            # Verify matching pairs
            n_matched = 0
            for img_path in (split_dir / 'images').glob('*.[jp][pn][g]'):
                label_path = split_dir / 'labels' / f'{img_path.stem}.txt'
                if label_path.exists():
                    n_matched += 1
            
            stats[split] = {
                'images': n_images,
                'labels': n_labels,
                'matched_pairs': n_matched
            }
        
        return stats

    def generate_dataset_yaml(self, output_path: str) -> None:
        """
        Generate YAML configuration file for YOLOv8 training.
        """
        config = {
            'path': str(self.base_dir),
            'train': 'train/images',
            'val': 'valid/images',
            'test': 'test/images',
            'names': {
                0: 'fracture'
            },
            'nc': 1
        }
        
        with open(output_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Prepare X-ray dataset for fracture detection")
    parser.add_argument("--source", type=str, required=True, help="Source directory with images and annotations")
    parser.add_argument("--output", type=str, required=True, help="Output directory for processed dataset")
    parser.add_argument("--yaml", type=str, required=True, help="Output path for dataset YAML config")
    
    args = parser.parse_args()
    
    # Initialize loader
    loader = XrayDatasetLoader(args.output)
    
    # Load and split dataset
    print("Loading and splitting dataset...")
    counts = loader.load_and_split_dataset(args.source)
    print("Dataset split complete:")
    for split, count in counts.items():
        print(f"  {split}: {count} images")
    
    # Verify dataset
    print("\nVerifying dataset integrity...")
    stats = loader.verify_dataset()
    for split, split_stats in stats.items():
        print(f"\n{split} set:")
        for key, value in split_stats.items():
            print(f"  {key}: {value}")
    
    # Generate YAML config
    loader.generate_dataset_yaml(args.yaml)
    print(f"\nDataset YAML configuration saved to: {args.yaml}")