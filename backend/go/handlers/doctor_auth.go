package handlers

import (
	"context"
	"os"
	"time"

	"fracture-detection-webapp/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"golang.org/x/crypto/bcrypt"
)

type DoctorRegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type DoctorLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterDoctor(c *fiber.Ctx) error {
	var req DoctorRegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
	}
	doctor := models.Doctor{
		ID:           primitive.NewObjectID(),
		Email:        req.Email,
		PasswordHash: string(hash),
		Name:         req.Name,
		CreatedAt:    time.Now(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = models.DB.Collection("doctors").InsertOne(ctx, doctor)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create doctor"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Doctor registered successfully"})
}

func LoginDoctor(c *fiber.Ctx) error {
	var req DoctorLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var doctor models.Doctor
	err := models.DB.Collection("doctors").FindOne(ctx, bson.M{"email": req.Email}).Decode(&doctor)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}
	if err := bcrypt.CompareHashAndPassword([]byte(doctor.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["userId"] = doctor.ID.Hex()
	claims["role"] = "doctor"
	claims["email"] = doctor.Email
	claims["exp"] = time.Now().Add(24 * time.Hour).Unix()
	tokenStr, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}
	return c.JSON(fiber.Map{"token": tokenStr})
} 