## **Khmer Sign language to-do list** Loem Kimhour

## **Sprint 1: The Core Foundation (Weeks 1-2)**

**Goal:** Establish the environment, authentication, and primary navigation.

### **1.1 Infrastructure & Environment**

* Initialize GitHub repositories for Frontend (Next.js) and Backend (FastAPI).  
* Configure `.env` templates for both repos (DB URLs, JWT Secrets, API Keys).  
* Set up local PostgreSQL instance and verify connection.  
* Configure Backend CORS to allow requests from the Frontend local dev server.  
* Initialize Python virtual environment and install core libs (`FastAPI`, `SQLAlchemy`, `Alembic`, `Pydantic`).

### **1.2 Backend: Authentication & User Models**

* Create SQLAlchemy `User` model (ID, Email, Name, Auth Provider, Created At).  
* Implement JWT utility functions (Token generation, password hashing, validation).  
* Create OAuth endpoints (Google/Facebook/Telegram) and a Guest Login route.  
* Build a "Get Current User" dependency/middleware for protected routes.

### **1.3 Frontend: UI Shell & Auth UI**

* Initialize Next.js with App Router and install MUI/Emotion.  
* Configure `theme.js` (Orange primary palette, rounded borders, custom typography).  
* Set up **Zustand** stores for `authStore` (managing user sessions).  
* Build Login/Signup pages with social buttons and Guest Login trigger.  
* Build the persistent **Bottom Navigation Bar** and **Top App Bar** with back buttons.

### **1.4 Database: Curriculum Skeleton**

* Define models for `Units`, `Chapters`, and `Lessons` (with `order_index`).  
* Set up basic seed script to populate a sample Unit, Chapter, and Lesson.  
* Build the API endpoint to fetch the list of Units.

## **Sprint 2: Content & Dictionary (Weeks 3-4)**

**Goal:** Build the data-heavy curriculum flow and the searchable dictionary.

### **2.1 Backend: Data Logic & Media Models**

* Create `Words` table (ID, Khmer text, English text, Video URL).  
* Create `LessonWords` junction table to map specific words to lessons.  
* Write complex join queries (Units \-\> Chapters \-\> Lessons) into a single nested JSON response.  
* Implement `is_locked` logic: Check user progress to return lock status for lessons.

### **2.2 Frontend: Curriculum & Progress UI**

* Build the **Unit List View** (with progress bars).  
* Build the **Chapter List View** (nested under Unit).  
* Build the **Lesson List View** (visual icons for Locked/Unlocked states).

### **2.3 Dictionary System**

* Build Backend text-search endpoint for the `Words` table.  
* Build Frontend Search Bar and Word List view.  
* Build **Word Detail View**: Implement a custom HTML5 `<video>` player (muted, auto-looping, no controls).

### **2.4 Progress Tracking Persistence**

* Create `user_lesson_progress` table (User ID, Lesson ID, Score, Highest Accuracy, Is Completed).  
* Create Backend POST endpoint to update user progress upon lesson completion.

## **Sprint 3: The Quiz Engine (Weeks 5-6)**

**Goal:** Create a dynamic testing environment with automated content generation.

### **3.1 Backend: Quiz Logic**

* Create `Exercises` table (Question type, correct answer, optional JSON options).  
* Implement **Distractor Generator**: Logic to pull random wrong answers from the `Words` table if not hardcoded.  
* Create an endpoint to fetch "Lesson Quiz Content" (Words \+ Exercises).

### **3.2 Frontend: Quiz State Machine**

* Create `quizStore` in Zustand to manage: `currentIndex`, `score`, `timer`, `answersArray`.  
* Build a dynamic Quiz Wrapper component that switches views based on the question type.

### **3.3 Question Components & Feedback**

* Build `MultipleChoiceText`: Video prompt vs. text options.  
* Build `MultipleChoiceVideo`: Text prompt vs. grid of video options.  
* Build `TextInput`: Video prompt vs. Khmer text input (string-matching).  
* Build `TrueFalse`: Video/Text prompt vs. boolean buttons.  
* Implement **Feedback UI**: Overlay for Green (Correct) / Red (Wrong) with "Next" button.

### **3.4 Completion & Sync**

* Build **Celebration Screen**: Lottie animation \+ "Back to Lessons" button.  
* Connect the final "Submit" button to the Backend Progress endpoint.

## **Sprint 4: AI & WebSocket Pipeline (Weeks 7-8)**

**Goal:** Establish the bridge between the user's camera and the AI model.

### **4.1 Frontend: MediaPipe & Camera**

* Install `@mediapipe/holistic` and `opencv-js`.  
* Build the **Camera UI**: Split-screen (Instructor Video | User Webcam).  
* Implement `navigator.mediaDevices.getUserMedia` for webcam access.  
* Implement a **Keypoint Extraction Loop**: Use MediaPipe to process frames and extract x, y, z coordinates.

### **4.2 WebSocket Architecture**

* Backend: Create a FastAPI WebSocket route (`/ws/sign-detect`).  
* Frontend: Implement `useWebSocket` hook to send keypoint JSON objects every X milliseconds.  
* Implement logic to handle connection opening, closing, and error retries.

### **4.3 AI Inference Pipeline**

* Backend: Implement JSON-to-NumPy/Tensor conversion logic inside the WS handler.  
* Integrate your pre-trained model: Call `model.predict(input_data)`.  
* Backend: Format prediction into `predicted_class` and `confidence_score`.

## **Sprint 5: Feedback & Polish (Weeks 9-10)**

**Goal:** Finalize the user experience, stats, and system stability.

### **5.1 Real-Time UI Feedback**

* Frontend: Listen for WS messages and display a real-time **"Accuracy %"** gauge.  
* Implement "Pass" Logic: If `accuracy > threshold` for a sustained period, trigger success.  
* Optimize the frame rate (FPS) of the keypoint extraction to ensure the UI doesn't lag.

### **5.2 User Profile & Statistics**

* Build Backend endpoint to aggregate user stats (Total lessons, Avg Accuracy, Streak).  
* Build **Profile View**: Display user info, stats, and a Logout button.  
* Add a "Finger Spelling" entry point on the dashboard (mapping to a specific practice mode).

### **5.3 Final Polish & Quality Assurance**

* **Responsive Review**: Ensure all screens work on small mobile devices (MUI breakpoints).  
* **Bug Squashing**: Fix WebSocket disconnect issues and UI state resets.  
* **Theme Consistency**: Final check on primary orange colors and border-radii across the app.  
* Final deployment test (Local for dev, checking DB migrations via Alembic).

