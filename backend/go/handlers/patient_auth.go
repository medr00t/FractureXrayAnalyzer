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

type PatientRegisterRequest struct {
	DoctorID  string `json:"doctorId"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type PatientLoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterPatient(c *fiber.Ctx) error {
	var req PatientRegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	doctorObjID, err := primitive.ObjectIDFromHex(req.DoctorID)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid doctorId"})
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to hash password"})
	}
	patient := models.Patient{
		ID:           primitive.NewObjectID(),
		DoctorID:     doctorObjID,
		Email:        req.Email,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		CreatedAt:    time.Now(),
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, err = models.DB.Collection("patients").InsertOne(ctx, patient)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create patient"})
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "Patient registered successfully"})
}

func LoginPatient(c *fiber.Ctx) error {
	var req PatientLoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	var patient models.Patient
	err := models.DB.Collection("patients").FindOne(ctx, bson.M{"email": req.Email}).Decode(&patient)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}
	if err := bcrypt.CompareHashAndPassword([]byte(patient.PasswordHash), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["userId"] = patient.ID.Hex()
	claims["role"] = "patient"
	claims["email"] = patient.Email
	claims["exp"] = time.Now().Add(24 * time.Hour).Unix()
	tokenStr, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}
	return c.JSON(fiber.Map{"token": tokenStr})
} 