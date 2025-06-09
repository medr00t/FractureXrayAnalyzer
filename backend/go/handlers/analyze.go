package handlers

import (
	"bytes"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"

	"github.com/gofiber/fiber/v2"
)

// This handler mocks AI analysis and stores a report
func AnalyzeImage(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		log.Printf("FormFile error: %v", err)
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "No image file provided"})
	}

	src, err := file.Open()
	if err != nil {
		log.Printf("File open error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not open uploaded file"})
	}
	defer src.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", file.Filename)
	if err != nil {
		log.Printf("CreateFormFile error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create form file"})
	}
	_, err = io.Copy(part, src)
	if err != nil {
		log.Printf("io.Copy error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not copy file content"})
	}
	writer.Close()

	pythonURL := os.Getenv("PYTHON_SERVICE_URL")
	if pythonURL == "" {
		pythonURL = "http://localhost:8000/analyze"
	}

	req, err := http.NewRequest("POST", pythonURL, body)
	if err != nil {
		log.Printf("NewRequest error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create request to Python service"})
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("Python service request error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not send request to Python service"})
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("ReadAll error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not read response from Python service"})
	}

	return c.Status(resp.StatusCode).Send(respBody)
} 