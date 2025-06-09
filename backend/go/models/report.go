package models

import (
    "time"

    "go.mongodb.org/mongo-driver/bson/primitive"
)

type Report struct {
    ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    UserID       primitive.ObjectID `bson:"userId" json:"userId"`
    ImageName    string             `bson:"imageName" json:"imageName"`
    FractureType string             `bson:"fractureType" json:"fractureType"`
    RecoveryTime string             `bson:"recoveryTime" json:"recoveryTime"`
    CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
}