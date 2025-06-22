package models

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var DB *mongo.Database

func InitMongo() {
	mongoURI := os.Getenv("MONGO_URI")
	dbName := os.Getenv("MONGO_DB")

	if mongoURI == "" {
		mongoURI = "mongodb://localhost:27017" // Default value if not set
	}
	if dbName == "" {
		dbName = "fracture_detection_db" // Default value if not set
	}

	log.Printf("Connecting to MongoDB at URI: %s", mongoURI)
	log.Printf("Using database: %s", dbName)

	client, err := mongo.NewClient(options.Client().ApplyURI(mongoURI))
	if err != nil {
		panic(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	err = client.Connect(ctx)
	if err != nil {
		panic(err)
	}
	DB = client.Database(dbName)
}
