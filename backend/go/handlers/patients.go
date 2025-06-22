package handlers

import (
	"context"
	"time"

	"fracture-detection-webapp/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// GetMyPatients retrieves all patients created by the currently logged-in doctor.
func GetMyPatients(c *fiber.Ctx) error {
	doctorIDRaw := c.Locals("userId")
	if doctorIDRaw == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "User ID not found in token"})
	}

	doctorIDStr, ok := doctorIDRaw.(string)
	if !ok {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "User ID is not in a valid format"})
	}

	doctorID, err := primitive.ObjectIDFromHex(doctorIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid doctor ID in token"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := models.DB.Collection("users").Find(ctx, bson.M{
		"role":      "patient",
		"createdBy": doctorID,
	})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch patients"})
	}
	defer cursor.Close(ctx)

	var patients []models.User
	if err = cursor.All(ctx, &patients); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode patients"})
	}

	// In case the doctor has no patients, return an empty array instead of null
	if patients == nil {
		patients = make([]models.User, 0)
	}

	return c.JSON(patients)
}
