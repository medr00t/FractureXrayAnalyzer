package handlers

import (
	"context"
	"crypto/sha256"
	"fmt"
	"time"

	"fracture-detection-webapp/models"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// CreateDoctorRequest defines the payload for creating a doctor.
type CreateDoctorRequest struct {
	FullName string `json:"fullName"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// CreateDoctor handles the creation of a new doctor by a chef.
func CreateDoctor(c *fiber.Ctx) error {
	// The user making the request (the chef)
	chefIDStr := c.Locals("userId").(string)
	chefID, _ := primitive.ObjectIDFromHex(chefIDStr)

	var payload CreateDoctorRequest
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// Validate required fields
	if payload.FullName == "" || payload.Email == "" || payload.Password == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Full name, email, and password are required"})
	}

	// Check if user with the same email already exists
	var existingUser models.User
	err := models.DB.Collection("users").FindOne(context.Background(), bson.M{"email": payload.Email}).Decode(&existingUser)
	if err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": "A user with this email already exists"})
	}

	// Hash the password
	hashedPassword := fmt.Sprintf("%x", sha256.Sum256([]byte(payload.Password)))

	// Create the new doctor user
	newDoctor := models.User{
		ID:        primitive.NewObjectID(),
		FullName:  payload.FullName,
		Email:     payload.Email,
		Password:  hashedPassword,
		Role:      "doctor", // Assign the doctor role
		CreatedBy: chefID,
		CreatedAt: time.Now(),
		// Add any other default fields for a doctor here
	}

	_, err = models.DB.Collection("users").InsertOne(context.Background(), newDoctor)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create doctor account"})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Doctor account created successfully",
		"user":    newDoctor,
	})
}
