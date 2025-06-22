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
	"fracture-detection-webapp/utils"

	"mime/multipart"

	"crypto/sha256"

	"github.com/gofiber/fiber/v2"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EnrichedReport defines the structure for a report including patient and doctor names.
type EnrichedReport struct {
	models.Report `bson:",inline"`
	PatientName   string `bson:"patientName" json:"patientName"`
	DoctorName    string `bson:"doctorName" json:"doctorName"`
}

// Hardcoded Gmail credentials for local testing
var emailUser = "forfirefree31@gmail.com" // <-- put your Gmail here
var emailPass = "ccsbzrcfeatufgmb"        // ccsb zrcf eatu fgmb

func GetMyReports(c *fiber.Ctx) error {
	userIDStr := c.Locals("userId").(string)
	userRole := c.Locals("role").(string)
	userID, err := primitive.ObjectIDFromHex(userIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid user ID in token"})
	}

	filter := bson.M{}
	if userRole == "doctor" {
		filter["doctorId"] = userID
	} else if userRole == "patient" {
		filter["patientId"] = userID
	} else {
		// For other roles like 'chef', or if role is not specified, return no reports
		return c.JSON([]models.Report{})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Aggregation pipeline to enrich reports with patient and doctor names
	pipeline := mongo.Pipeline{
		{{"$match", filter}},
		{{"$lookup", bson.M{
			"from":         "users",
			"localField":   "patientId",
			"foreignField": "_id",
			"as":           "patientInfo",
		}}},
		{{"$unwind", bson.M{"path": "$patientInfo", "preserveNullAndEmptyArrays": true}}},
		{{"$lookup", bson.M{
			"from":         "users",
			"localField":   "doctorId",
			"foreignField": "_id",
			"as":           "doctorInfo",
		}}},
		{{"$unwind", bson.M{"path": "$doctorInfo", "preserveNullAndEmptyArrays": true}}},
		{{"$addFields", bson.M{
			"patientName": "$patientInfo.fullName",
			"doctorName":  "$doctorInfo.fullName",
		}}},
		{{"$project", bson.M{
			"patientInfo": 0,
			"doctorInfo":  0,
		}}},
		{{"$sort", bson.M{"createdAt": -1}}},
	}

	cursor, err := models.DB.Collection("reports").Aggregate(ctx, pipeline, options.Aggregate())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch reports"})
	}
	defer cursor.Close(ctx)

	var reports []EnrichedReport
	if err = cursor.All(ctx, &reports); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode reports"})
	}

	if reports == nil {
		reports = make([]EnrichedReport, 0)
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
		age := 0
		ageStr := c.FormValue("age")
		if ageStr != "" {
			fmt.Sscanf(ageStr, "%d", &age)
		}
		phoneNumber := c.FormValue("phoneNumber")
		if phoneNumber == "" {
			phoneNumber = ""
		}
		notes := c.FormValue("notes")
		if notes == "" {
			notes = ""
		}
		password := c.FormValue("password")
		var hashedPassword string
		if password != "" {
			hashedPassword = fmt.Sprintf("%x", sha256.Sum256([]byte(password)))
		}
		newPatient := models.User{
			ID:          primitive.NewObjectID(),
			FullName:    c.FormValue("fullName"),
			Email:       c.FormValue("email"),
			Password:    hashedPassword,
			Role:        "patient",
			CreatedBy:   doctorID,
			CreatedAt:   time.Now(),
			Age:         age,
			PhoneNumber: phoneNumber,
			Notes:       notes,
		}
		_, err := models.DB.Collection("users").InsertOne(context.Background(), newPatient)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to create new patient"})
		}
		patientID = newPatient.ID
	}

	// 4. Create and Insert Report
	newReport := models.Report{
		ID:             primitive.NewObjectID(),
		PatientID:      patientID,
		DoctorID:       doctorID,
		ImageName:      file.Filename,
		AnnotatedImage: *analysisResult.ImageBase64,
		FractureType:   analysisResult.Type,
		RecoveryTime:   fmt.Sprintf("%d days", *analysisResult.RecoveryTime),
		Confidence:     analysisResult.Confidence,
		CreatedAt:      time.Now(),
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

// GetReportByID fetches a single report document by its ID.
func GetReportByID(c *fiber.Ctx) error {
	reportIDStr := c.Params("id")
	reportID, err := primitive.ObjectIDFromHex(reportIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid report ID format"})
	}

	var report models.Report
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = models.DB.Collection("reports").FindOne(ctx, bson.M{"_id": reportID}).Decode(&report)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Report not found"})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch report"})
	}

	// Fetch patient info
	var patient models.User
	_ = models.DB.Collection("users").FindOne(ctx, bson.M{"_id": report.PatientID}).Decode(&patient)

	// Fetch doctor info
	var doctor models.User
	_ = models.DB.Collection("users").FindOne(ctx, bson.M{"_id": report.DoctorID}).Decode(&doctor)

	return c.JSON(fiber.Map{
		"id":             report.ID.Hex(),
		"patient":        patient,
		"doctor":         doctor,
		"imageName":      report.ImageName,
		"annotatedImage": report.AnnotatedImage,
		"fractureType":   report.FractureType,
		"recoveryTime":   report.RecoveryTime,
		"confidence":     report.Confidence,
		"createdAt":      report.CreatedAt,
	})
}

// DeleteReport handles the deletion of a single report.
func DeleteReport(c *fiber.Ctx) error {
	reportIDStr := c.Params("id")
	reportID, err := primitive.ObjectIDFromHex(reportIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid report ID format"})
	}

	userIDStr := c.Locals("userId").(string)
	userID, _ := primitive.ObjectIDFromHex(userIDStr)

	// Security check: Ensure the user deleting the report is the doctor who created it.
	var report models.Report
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err = models.DB.Collection("reports").FindOne(ctx, bson.M{"_id": reportID}).Decode(&report)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Report not found"})
	}

	if report.DoctorID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "You are not authorized to delete this report"})
	}

	// Proceed with deletion
	_, err = models.DB.Collection("reports").DeleteOne(ctx, bson.M{"_id": reportID})
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to delete report"})
	}

	return c.SendStatus(fiber.StatusNoContent) // 204 No Content on successful deletion
}

// GetAllReports returns all reports in the collection, enriched with patient and doctor names.
func GetAllReports(c *fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pipeline := mongo.Pipeline{
		{{"$lookup", bson.M{
			"from":         "users",
			"localField":   "patientId",
			"foreignField": "_id",
			"as":           "patientInfo",
		}}},
		{{"$unwind", bson.M{"path": "$patientInfo", "preserveNullAndEmptyArrays": true}}},
		{{"$lookup", bson.M{
			"from":         "users",
			"localField":   "doctorId",
			"foreignField": "_id",
			"as":           "doctorInfo",
		}}},
		{{"$unwind", bson.M{"path": "$doctorInfo", "preserveNullAndEmptyArrays": true}}},
		{{"$addFields", bson.M{
			"patientName": "$patientInfo.fullName",
			"doctorName":  "$doctorInfo.fullName",
		}}},
		{{"$project", bson.M{
			"patientInfo": 0,
			"doctorInfo":  0,
		}}},
		{{"$sort", bson.M{"createdAt": -1}}},
	}

	cursor, err := models.DB.Collection("reports").Aggregate(ctx, pipeline, options.Aggregate())
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to fetch reports"})
	}
	defer cursor.Close(ctx)

	var reports []EnrichedReport
	if err = cursor.All(ctx, &reports); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to decode reports"})
	}

	if reports == nil {
		reports = make([]EnrichedReport, 0)
	}

	return c.JSON(reports)
}

// NotifyPatientByEmail sends an email notification to the patient for a report
func NotifyPatientByEmail(c *fiber.Ctx) error {
	reportIDStr := c.Params("reportId")
	reportID, err := primitive.ObjectIDFromHex(reportIDStr)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid report ID format"})
	}

	role := c.Locals("role").(string)
	if role != "doctor" && role != "chef" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Only doctors or chefs can notify patients"})
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var report models.Report
	err = models.DB.Collection("reports").FindOne(ctx, bson.M{"_id": reportID}).Decode(&report)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Report not found"})
	}

	var patient models.User
	err = models.DB.Collection("users").FindOne(ctx, bson.M{"_id": report.PatientID}).Decode(&patient)
	if err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Patient not found"})
	}

	if patient.Email == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Patient does not have an email address"})
	}

	subject := "New X-ray Report Available"
	body := fmt.Sprintf(`
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>New X-ray Report</title>
			<style>
				body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
				.container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; }
				.header { background-color: #007bff; color: #ffffff; padding: 20px; text-align: center; }
				.content { padding: 30px; }
				.content h2 { color: #333333; }
				.report-details { border-left: 4px solid #007bff; padding-left: 15px; margin-top: 20px; }
				.footer { padding: 20px; text-align: center; font-size: 12px; color: #777777; background-color: #f9f9f9; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h1>New X-ray Report Available</h1>
				</div>
				<div class="content">
					<h2>Dear %s,</h2>
					<p>A new X-ray report has been generated for you. Please see the details below:</p>
					<div class="report-details">
						<p><strong>Fracture Type:</strong> %s</p>
						<p><strong>Estimated Recovery:</strong> %s</p>
					</div>
					<p style="margin-top: 30px;">Please log in to your account to view the full report, including the annotated image.</p>
				</div>
				<div class="footer">
					<p>This is an automated notification. Please do not reply to this email.</p>
				</div>
			</div>
		</body>
		</html>
	`, patient.FullName, report.FractureType, report.RecoveryTime)

	err = utils.SendEmailWithCreds(patient.Email, subject, body, emailUser, emailPass)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to send email: " + err.Error()})
	}

	return c.JSON(fiber.Map{"message": "Notification email sent successfully"})
}
