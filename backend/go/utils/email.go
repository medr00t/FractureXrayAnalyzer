package utils

import (
	"fmt"
	"log"
	"net/smtp"
	"os"
)

// SendEmailWithCreds sends an email using the provided credentials
func SendEmailWithCreds(to, subject, body, emailUser, emailPass string) error {
	if emailUser == "" {
		log.Println("EMAIL_USER is missing!")
	}
	if emailPass == "" {
		log.Println("EMAIL_PASSWORD is missing!")
	}
	if emailUser == "" || emailPass == "" {
		return fmt.Errorf("email credentials not set")
	}

	smtpHost := "smtp.gmail.com"
	smtpPort := "587"
	auth := smtp.PlainAuth("", emailUser, emailPass, smtpHost)

	// Compose the message
	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"MIME-version: 1.0;\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\";\r\n\r\n" +
		body)

	addr := smtpHost + ":" + smtpPort
	return smtp.SendMail(addr, auth, emailUser, []string{to}, msg)
}

// SendEmail sends an email using Gmail SMTP and env vars
func SendEmail(to, subject, body string) error {
	emailUser := os.Getenv("EMAIL_USER")
	emailPass := os.Getenv("EMAIL_PASSWORD")
	return SendEmailWithCreds(to, subject, body, emailUser, emailPass)
}
