package main

import (
	"log"
	"os"

	"fracture-detection-webapp/handlers"
	"fracture-detection-webapp/middleware"
	"fracture-detection-webapp/models"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("Warning: .env file not found")
	}
	models.InitMongo()

	app := fiber.New(fiber.Config{
		AppName: "Fracture Detection API",
	})
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE",
	}))

	api := app.Group("/api")

	// Unified Auth routes
	auth := api.Group("/auth")
	auth.Post("/register", handlers.Register)
	auth.Post("/login", handlers.Login)

	// Protected routes
	api.Get("/patients", middleware.IsAuthenticated, handlers.GetMyPatients)
	api.Post("/analyze", middleware.IsAuthenticated, handlers.AnalyzeImage)
	api.Get("/reports", middleware.IsAuthenticated, handlers.GetMyReports)
	api.Post("/reports/create", middleware.IsAuthenticated, handlers.CreateReport)

	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "API is working!"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}
	log.Printf("API running at http://localhost:%s/api", port)
	log.Fatal(app.Listen(":" + port))
}
