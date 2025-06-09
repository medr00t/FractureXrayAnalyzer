package models

import (
    "go.mongodb.org/mongo-driver/bson/primitive"
    "time"
)

type Doctor struct {
    ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
    Email        string             `bson:"email" json:"email"`
    PasswordHash string             `bson:"passwordHash" json:"-"`
    Name         string             `bson:"name" json:"name"`
    CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
} 