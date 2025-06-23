package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v4"
)

// IsAuthenticated is a middleware that checks for a valid JWT.
func IsAuthenticated(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing or malformed JWT"})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Don't forget to validate the alg is what you expect:
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fiber.NewError(fiber.StatusUnauthorized, "Unexpected signing method")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid or expired JWT"})
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid JWT claims"})
	}

	c.Locals("userId", claims["userId"])
	c.Locals("role", claims["role"])

	return c.Next()
}

// IsChef is a middleware that checks if the user is authenticated and has the 'chef' role.
func IsChef(c *fiber.Ctx) error {
	// First, run the standard authentication check.
	if err := IsAuthenticated(c); err != nil {
		return err
	}

	// Then, check the role.
	role := c.Locals("role").(string)
	if role != "chef" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Access denied. Chef role required."})
	}

	return c.Next()
}

func AuthRequired(role string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		return c.Next()
	}
}
