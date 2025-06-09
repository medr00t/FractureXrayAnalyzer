package models

import (
    "context"
    "os"
    "time"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func InitMongo() {
    client, err := mongo.NewClient(options.Client().ApplyURI(os.Getenv("MONGO_URI")))
    if err != nil { panic(err) }
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    err = client.Connect(ctx)
    if err != nil { panic(err) }
    DB = client.Database(os.Getenv("MONGO_DB"))
} 