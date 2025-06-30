# 🦴 XRay Fracture Detection Platform

This project is an end-to-end web application that allows medical professionals (chefs and doctors) to upload X-ray images, detect and classify bone fractures using deep learning, and generate medical reports that can be shared with patients via email.

---

## 📌 Features

### 👨‍⚕️ User Roles
- **Chef (Admin)**: 
  - Can create doctor accounts.
  - Can create patients and perform analysis like a doctor.
- **Doctor**:
  - Can register patients.
  - Can upload and analyze X-rays.
  - Can view and delete their own reports.
  - Can notify patients via email after analysis.
- **Patient**:
  - Can log in to view their own reports.
  - Can download reports as PDF.

---

### 🧠 AI-Based Fracture Detection
- Uses **YOLOv8** trained on a custom dataset.
- Predicts:
  - **Fracture type** (e.g., humerus, forearm, etc.)
  - **Annotated X-ray image**
  - **Estimated recovery time**
  - **Confidence score**
- Model achieves **~60.7% mAP@0.5** on the validation set.

---

### 📧 Email Notification System
- After an analysis, doctors can click **"Notify patient by email"** to:
  - Automatically send a summary of the report.
  - Include key details like fracture type and recovery time.
- Emails are sent using Gmail SMTP and Fiber backend.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript |
| **Backend** | Go (Fiber) |
| **AI Service** | Python (FastAPI + YOLOv8) |
| **Database** | MongoDB |
| **Emailing** | Go + Gmail SMTP |
| **Authentication** | JWT (Role-based: chef, doctor, patient) |

---

## 📁 Project Structure

### 🧩 Backend (`/backend/go`)
- `handlers/`: Logic for auth, analysis, reports, patients.
- `models/`: MongoDB models.
- `middleware/`: JWT protection.
- `utils/email.go`: Email sending logic.
- `main.go`: API routing & server.

### 🎨 Frontend (`/frontend/src`)
- `pages/`: Route-level components.
- `components/`: Upload, report list, PDF generation.
- `api/`: Axios logic for backend interaction.
- `context/`: Auth context.

---

## 📬 Setup Instructions

### 🔐 Configure Environment

In `go/.env`:
```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
PYTHON_SERVICE_URL=http://localhost:8000/analyze
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASSWORD=your_app_password
