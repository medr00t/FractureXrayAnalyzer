import cv2
import numpy as np
from pathlib import Path
from typing import Tuple
import yaml

def apply_clahe(image: np.ndarray, clip_limit: float = 3.0, grid_size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """Apply CLAHE to enhance local contrast."""
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=grid_size)
    return clahe.apply(image)

def enhance_bone_structures(image: np.ndarray) -> np.ndarray:
    """Enhance bone structures using image processing techniques."""
    # Apply bilateral filter to reduce noise while preserving edges
    bilateral = cv2.bilateralFilter(image, d=9, sigmaColor=75, sigmaSpace=75)
    
    # Apply unsharp masking to enhance edges
    gaussian = cv2.GaussianBlur(bilateral, (0, 0), 3.0)
    unsharp_mask = cv2.addWeighted(bilateral, 1.5, gaussian, -0.5, 0)
    
    # Enhance contrast
    lab = cv2.cvtColor(unsharp_mask, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    cl = clahe.apply(l)
    enhanced = cv2.merge((cl, a, b))
    
    return cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

def normalize_image(image: np.ndarray) -> np.ndarray:
    """Normalize pixel values to [0,1] range."""
    return image.astype(np.float32) / 255.0

def preprocess_xray(image_path: str, output_path: str) -> None:
    """Preprocess X-ray images for fracture detection."""
    # Read image
    image = cv2.imread(image_path)
    if image is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    # Apply CLAHE for contrast enhancement
    enhanced = apply_clahe(image)
    
    # Enhance bone structures
    enhanced = enhance_bone_structures(cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR))
    
    # Normalize
    normalized = normalize_image(enhanced)
    
    # Save preprocessed image
    cv2.imwrite(output_path, (normalized * 255).astype(np.uint8))

def batch_preprocess(input_dir: str, output_dir: str) -> None:
    """Process all images in a directory."""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    for img_path in input_path.glob("*.jpg"):
        out_file = output_path / img_path.name
        try:
            preprocess_xray(str(img_path), str(out_file))
            print(f"Processed: {img_path.name}")
        except Exception as e:
            print(f"Error processing {img_path.name}: {e}")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Preprocess X-ray images for fracture detection")
    parser.add_argument("--input_dir", type=str, required=True, help="Input directory containing X-ray images")
    parser.add_argument("--output_dir", type=str, required=True, help="Output directory for preprocessed images")
    
    args = parser.parse_args()
    batch_preprocess(args.input_dir, args.output_dir)