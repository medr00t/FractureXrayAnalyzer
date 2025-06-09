package handlers

import (
	"context"
	"time"

	"fracture-detection-webapp/models"
	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

func GetMyReports(c *fiber.Ctx) error {
	patientId := c.Locals("userId").(string)
	patientObjID, err := primitive.ObjectIDFromHex(patientId)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid patientId in token"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	cursor, err := models.DB.Collection("reports").Find(ctx, bson.M{"patientId": patientObjID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch reports"})
	}
	defer cursor.Close(ctx)
	var reports []models.Report
	for cursor.Next(ctx) {
		var report models.Report
		if err := cursor.Decode(&report); err == nil {
			reports = append(reports, report)
		}
	}
	return c.JSON(reports)
} 