package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Report represents a single fracture analysis report in the database.
type Report struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	PatientID    primitive.ObjectID `bson:"patientId" json:"patientId"`
	DoctorID     primitive.ObjectID `bson:"doctorId" json:"doctorId"`
	ImageName    string             `bson:"imageName" json:"imageName"`
	FractureType string             `bson:"fractureType" json:"fractureType"`
	RecoveryTime string             `bson:"recoveryTime" json:"recoveryTime"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
}

// AnalyzeResponse represents the expected response from the Python backend.
type AnalyzeResponse struct {
	Detected     bool     `json:"detected"`
	Type         string   `json:"type"`
	RecoveryTime *int     `json:"recovery_time"`
	ImageBase64  *string  `json:"image_base64"`
	Confidence   *float64 `json:"confidence"`
}
