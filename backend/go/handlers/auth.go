package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fracture-detection-webapp/models"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// RegisterRequest defines the shape of the request for user registration.
type RegisterRequest struct {
	FullName  string `json:"fullName"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	Role      string `json:"role"`
	CreatedBy string `json:"createdBy,omitempty"` // ID of the creator (chef for doctor, doctor for patient)
}

// LoginRequest defines the shape of the request for user login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// HashPasswordSHA256 hashes a password using SHA-256
func HashPasswordSHA256(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

// Register creates a new user based on the provided role.
func Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	// Basic validation
	if req.FullName == "" || req.Email == "" || req.Password == "" || req.Role == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Missing required fields"})
	}

	user := models.User{
		ID:        primitive.NewObjectID(),
		FullName:  req.FullName,
		Email:     req.Email,
		Password:  HashPasswordSHA256(req.Password),
		Role:      req.Role,
		CreatedAt: time.Now(),
	}

	// Handle the creator relationship
	if req.Role == "doctor" || req.Role == "patient" {
		creatorID, err := primitive.ObjectIDFromHex(req.CreatedBy)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid creator ID"})
		}
		user.CreatedBy = creatorID
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Insert the user into the database
	res, err := models.DB.Collection("users").InsertOne(ctx, user)
	if err != nil {
		log.Printf("Error inserting user: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create user"})
	}

	log.Printf("Successfully inserted user with ID: %v", res.InsertedID)

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"message": "User registered successfully"})
}

// Login authenticates a user and returns a JWT token.
func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request body"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := models.DB.Collection("users").FindOne(ctx, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		log.Printf("Error finding user '%s': %v", req.Email, err)
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "error bro here!"})
	}

	// Hash the incoming password and compare it with the stored hash
	hashedInput := HashPasswordSHA256(req.Password)
	if user.Password != hashedInput {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
	}

	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["userId"] = user.ID.Hex()
	claims["role"] = user.Role
	claims["email"] = user.Email
	claims["exp"] = time.Now().Add(24 * time.Hour).Unix()

	tokenStr, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to generate token"})
	}

	return c.JSON(fiber.Map{"token": tokenStr})
}
