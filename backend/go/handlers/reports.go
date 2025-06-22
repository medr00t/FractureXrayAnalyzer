package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"fracture-detection-webapp/models"

	"mime/multipart"

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

// CombinedResponse includes both the analysis result and the created report.
type CombinedResponse struct {
	Analysis models.AnalyzeResponse `json:"analysis"`
	Report   models.Report          `json:"report"`
}

// CreateReport handles the creation of a new report for a new or existing patient.
func CreateReport(c *fiber.Ctx) error {
	// 1. Handle Multipart Form Data
	form, err := c.MultipartForm()
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid form data"})
	}

	// 2. Handle Image Upload and Analysis
	files := form.File["image"]
	if len(files) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Image file is required"})
	}
	file := files[0]

	// This block is from analyze.go
	src, err := file.Open()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not open uploaded file"})
	}
	defer src.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", file.Filename)
	io.Copy(part, src)
	writer.Close()

	pythonURL := os.Getenv("PYTHON_SERVICE_URL")
	if pythonURL == "" {
		pythonURL = "http://localhost:8000/analyze"
	}
	req, _ := http.NewRequest("POST", pythonURL, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Python service request failed"})
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var analysisResult models.AnalyzeResponse
	json.Unmarshal(respBody, &analysisResult)
	// End of analysis block

	// 3. Handle Patient Logic
	doctorIDStr := c.Locals("userId").(string)
	doctorID, _ := primitive.ObjectIDFromHex(doctorIDStr)
	var patientID primitive.ObjectID

	existingPatientID := c.FormValue("existingPatientId")
	if existingPatientID != "" {
		patientID, _ = primitive.ObjectIDFromHex(existingPatientID)
	} else {
		newPatient := models.User{
			ID:        primitive.NewObjectID(),
			FullName:  c.FormValue("fullName"),
			Email:     c.FormValue("email"),
			Role:      "patient",
			CreatedBy: doctorID,
			CreatedAt: time.Now(),
		}
		_, err := models.DB.Collection("users").InsertOne(context.Background(), newPatient)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create new patient"})
		}
		patientID = newPatient.ID
	}

	// 4. Create and Insert Report
	newReport := models.Report{
		ID:           primitive.NewObjectID(),
		PatientID:    patientID,
		DoctorID:     doctorID,
		ImageName:    file.Filename,
		FractureType: analysisResult.Type,
		RecoveryTime: fmt.Sprintf("%d days", *analysisResult.RecoveryTime),
		CreatedAt:    time.Now(),
	}

	_, err = models.DB.Collection("reports").InsertOne(context.Background(), newReport)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create report"})
	}

	// 5. Return Combined Response
	return c.Status(fiber.StatusCreated).JSON(CombinedResponse{
		Analysis: analysisResult,
		Report:   newReport,
	})
}
