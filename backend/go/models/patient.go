package models

import (
    "go.mongodb.org/mongo-driver/bson/primitive"
    "time"
)

type Patient struct {
    ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    DoctorID     primitive.ObjectID `bson:"doctorId" json:"doctorId"`
    Email        string             `bson:"email" json:"email"`
    PasswordHash string             `bson:"passwordHash" json:"-"`
    FirstName    string             `bson:"firstName" json:"firstName"`
    LastName     string             `bson:"lastName" json:"lastName"`
    CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
} 