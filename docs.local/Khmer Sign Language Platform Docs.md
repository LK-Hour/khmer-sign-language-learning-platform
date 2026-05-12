# To-Do List: Khmer Sign Language Platform

# **Loem Kimhour:** 

## 1\. MVP (Minimum Viable Product) \- Core Features

**Authentication & Security**

* Multi-Channel Login: Integration with Google, Telegram, and Facebook via OAuth.  
* Anonymous Access: Normal Guest Login for immediate platform exploration.  
* Secure Session: JWT (JSON Web Token) implementation for secure authentication.


**Learning Platform (Curriculum Hierarchy)**

* **Units**: High-level groupings of sign language categories (e.g., "Basics", "Education").  
* **Chapters**: Sub-categories within units.  
* **Lessons**: Individual learning pages containing instructional videos and Khmer/English text.  
* **Lesson Progress**: Dynamic tracking of user completion status and scores per lesson.  
* **Interactive Exercise**: Quiz engine supporting Multiple Choice and True/False questions per lesson.


### 2\. Recommended Tech Stack

| Layers | Technology |
| ----- | ----- |
| Frontend | Next.js (App Router) |
| UI Framework | Material UI (MUI) |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT \+ NextAuth.js |
| File Storage | Local Storage (Dev phase)  |

| Category | Functionalities |
| ----- | ----- |
| **Authentication & Security** | Integration with Google, Telegram, and Facebook via OAuth . Anonymous Guest Login for immediate platform exploration . Secure Session management using JWT (JSON Web Token). |
| **Curriculum & Learning** | View Unit list with progress tracking . View Chapters within specific units . View Lessons within chapters, including locked/unlocked states . Access lesson details featuring instructional videos and Khmer/English text. |
| **Dictionary & Search** | Perform text-search queries for words in both English and Khmer . View word details with an auto-looping, muted HTML5 video player . Browse a paginated list of all sign language words. |
| **Interactive Exercises** | Take quizzes supporting Multiple Choice (Text/Video), True/False, and Text Input . Receive real-time color-coded feedback (success/failure) upon answering . View a "Celebration" screen upon completing a lesson or quiz. |
| **Real-Time AI Practice** | Access a split-screen layout for instructor reference vs. user webcam  Real-time sign language evaluation via WebSocket for immediate accuracy feedback . Automatic lesson completion trigger if accuracy exceeds a specific threshold. |
| **User Profile & Management** | View user statistics, total scores, and completed chapters . Update user account information and manage sessions (Logout) . Admin-level access to view/manage user profiles and current merchant data. |

### **Non-Functional Requirements**

These requirements define the system's operational standards and quality attributes.

| Category | Description |
| ----- | ----- |
| **Performance** | Requests must be delivered in a timely manner to ensure a smooth user experience. |
| **Security** | Uses JWT as a secure method for token-based authentication payloads. |
| **Maintainability** | The system uses standard codes and a modular tech stack (FastAPI/Next.js) to ensure ease of maintenance. |
| **Scalability** | The architecture is designed to be scalable, capable of handling growing user data and concurrent WebSocket connections. |
| **Usability** | The system must be easy to navigate with a mobile-first responsive user interface. |
| **Reliability** | The platform must be highly reliable with minimal downtime or processing errors during inference. |

## 

## **Sprint 1: The Core Foundation**

*Goal: Authenticated user navigating a themed shell with a connected DB.*

* **Infrastructure:** Initialize Git repos, FastAPI (SQLAlchemy/Pydantic), and Next.js (MUI/Zustand).  
* **Database:** Provision local PostgreSQL; implement **User** and **Curriculum** models (Units, Chapters, Lessons).  
* **Auth:** Implement JWT/OAuth and Guest Login on the backend; build Login/Signup and the **App Shell** (Bottom Nav/Top Bar) on the frontend.  
* **Navigation:** Build the Home Dashboard and the basic Unit/Chapter/Lesson list views.

## **Sprint 2: Content & Dictionary**

*Goal: A fully searchable dictionary and a functional curriculum flow.*

* **Data & Logic:** Populate **Dictionary/Media models**; write join queries to fetch curriculum hierarchies with `is_locked` logic.  
* **Dictionary Flow:** Build the searchable list and the **Video Detail view** with the auto-looping HTML5 player.  
* **Curriculum UI:** Polish the Lesson List view and implement the visual states for progress tracking.  
* **Progress:** Build the `user_lesson_progress` table and the backend logic to update scores.

## **Sprint 3: The Quiz Engine**

*Goal: Interactive testing and automated question generation.*

* **Quiz Logic:** Backend logic for random distractor generation; Frontend **Quiz State Machine**.  
* **Question Types:** Build `MultipleChoiceText`, `MultipleChoiceVideo`, and `TextInput` components.  
* **Feedback & Completion:** Implement the Green/Red feedback UI and the **Celebration screen** with Lottie animations.  
* **Integration:** Ensure quiz results successfully POST to the backend to unlock the next lesson.

## **Sprint 4: WebSocket Pipeline**

*Goal: Real-time hand-tracking and backend communication.*

* **Hardware & MediaPipe:** Implement `getUserMedia` and the **MediaPipe Holistic** initialization in Next.js.  
* **WebSocket Setup:** Build the FastAPI WebSocket endpoint; implement the **Keypoint Extraction Loop** on the frontend to send data.  
* **Inference Pipeline:** Backend logic to convert JSON keypoints to NumPy/Tensors and run `model.predict()`.  
* **UI:** Build the **Split-screen Camera UI** (Reference Video vs. User Webcam).

## **Sprint 5: Feedback & Polish**

*Goal: Real-time accuracy UI, Profile stats, and final debugging.*

* **Real-Time UX:** Listen to WebSocket responses to update the **"Accuracy %"** on screen.  
* **Logic:** Trigger "Lesson Complete" automatically when AI accuracy crosses the threshold.  
* **Profile & Stats:** Build the **User Profile view** with stats, progress charts, and logout.  
* **Final Polish:** End-to-end testing, bug fixes for the WebSocket stream, and MUI theme refinements for responsiveness.

### 4\. API Specification (Core APIs)

#### Authentication APIs

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **POST** | /api/auth/login/google | Login/Register using Google OAuth |
| **POST** | /api/auth/login/facebook | Login/Register using Facebook OAuth |
| **POST** | /api/auth/login/telgram | Login/Register using Telegram OAuth |
| **POST** | /api/auth/login/guest | Create a temporary guest session |
| **GET** | /api/auth/me | Fetch current user profile |

#### Learning Platform APIs

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **GET** | /api/signs/units | List all units |
| **GET** | /api/signs/units/{id}/chapters | List all chapters within a specific unit |
| **GET** | /api/signs/chapters/{id}/lessons | Fetch all lessons belonging to a chapter |
| **GET** | /api/signs/chapters/{id}/lessons | List all lessons within a specific chapter |
| **GET** | /api/signs/lessons | List all lessons with basic info |
| **GET** | /api/signs/lessons/{id} | Get detail of a specific lesson (video/text) |
| **POST** | /api/signs/lessons/{id}/practices/contribute | Upload contribute video to database |
| **GET** | /api/signs/lessons/{id}/practices | Fetch quiz questions for that lesson |
| **POST** | /api/signs/lessons/{id}/practices | Update user score and mark as complete |

#### 

#### Dictionary APIs

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **GET** | /api/dictionary | Paginated search of words (?search=term) |
| **GET** | /api/dictionary/{id} | Get specific word details/media |

### 2\. Practice (Exercise) APIs

These endpoints power the "Practice" tab in your bottom navigation bar, as well as the quiz/exercise modals that appear during the lesson flow.

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **GET** | /api/signs/exercises/chapters | Chapter Hub: Lists the available practice chapters (1, 2, 3...) as shown in your "Practice" tab |
| **GET** | /api/signs/exercises/chapters/{id} | Quiz Engine: Returns the array of quiz questions (Multiple Choice, True/False, Text Input) for a specific lesson |
| **POST** | /api/signs/exercises/chapters/{id}/submit | Submit Results: Sends the user's answers and final score to the server for grading |

# **Lorn Thornpunleu**

## 1\. MVP (Minimum Viable Product) \- Core Features

**Learning Platform (Curriculum Hierarchy)**

* **Units**: High-level groupings of sign language categories (e.g., "Consonant", "Vovel").  
* **Chapters**: Sub-categories within units.  
* **Lessons**:Learning each letter.  
* **Lesson Progress**: Dynamic tracking of user completion status and scores per lesson.  
* **Interactive Exercise**: Quiz engine supporting Multiple Choice,questions per lesson.

### 2\. Recommended Tech Stack

| Layers | Technology |
| ----- | ----- |
| Frontend | Next.js (App Router) |
| UI Framework | Material UI (MUI) |
| Backend API | FastAPI (Python) |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT \+ NextAuth.js |
| File Storage | Local Storage (MVP) / AWS S3 (Production) |

| Category | Functionalities |
| ----- | ----- |
| **Curriculum & Learning** | View Unit list with progress tracking . View Chapters within specific units . View Lessons within chapters, including locked/unlocked states . Access lesson details instructional images and Khmer/English text. |
| **Dictionary & Search** | Perform text-search queries for words in both English and Khmer . View word details . |
| **Interactive Exercises** | Take quizzes supporting Multiple Choice (Text/image), and Text Input . Receive real-time color-coded feedback (success/failure) upon answering . |
| **Real-Time AI Practice** | Access a split-screen layout for instructor reference vs. user webcam . Real-time sign language evaluation via WebSocket for immediate accuracy feedback . Automatic lesson completion trigger if accuracy exceeds a specific threshold. |
| **User Profile & Management** | View user statistics, total scores, and completed chapters . Update user account information and manage sessions (Logout) . Admin-level access to view/manage user profiles and current merchant data. |

Finger spelling track  
Finger Spelling is **image-based only** — no videos. Each lesson teaches one Khmer letter by displaying the hand sign image alongside the letter, its romanization, and its Khmer name.

### **Non-Functional Requirements**

These requirements define the system's operational standards and quality attributes.

| Category | Description |
| ----- | ----- |
| **Performance** | Requests must be delivered in a timely manner to ensure a smooth user experience. |
| **Security** | Uses JWT as a secure method for token-based authentication payloads. |
| **Maintainability** | The system uses standard codes and a modular tech stack (FastAPI/Next.js) to ensure ease of maintenance. |
| **Scalability** | The architecture is designed to be scalable, capable of handling growing user data and concurrent WebSocket connections. |
| **Usability** | The system must be easy to navigate with a mobile-first responsive user interface. |
| **Reliability** | The platform must be highly reliable with minimal downtime or processing errors during inference. |

### **Sprint 1: The Skeleton (Infra & Auth)**

*Focus: Environment setup and getting a user logged in.*

* **Infrastructure:** Initialize Repos for **Next.js** (App Router \+ MUI) and **FastAPI**.  
* **Database:** Provision PostgreSQL. Set up SQLAlchemy/Pydantic models for `Users` and `Progress`.  
* **Auth (back-end):** Implement JWT logic, Guest Login, and OAuth (Google/Facebook/Telegram).  
* **Auth (front-end):** Build Login/Signup screens and integrate with the Backend.  
* **Global State:** Initialize **Zustand/Redux** to persist user sessions and basic app settings.

### **Sprint 2: The Core Curriculum (Data & Navigation)**

*Focus: Getting the lessons from the DB to the screen.*

* **Schema (back-end):** Build models for `Units`, `Chapters`, `Lessons`, and `Exercises`.  
* **API (back-end):** Create endpoints to fetch the Curriculum hierarchy (Units \-\> Chapters \-\> Lessons) with `is_locked` logic.  
* **App Shell (front-end):** Build the mobile-first responsive wrapper, Bottom Nav, and Top Bar.  
* **Curriculum UI (front-end):** Build the Unit, Chapter, and Lesson list views.  
* **Dictionary:** Build the `Letters` table and the searchable Dictionary UI.

### **Sprint 3: The Engine Room (WebSockets & ML Pipeline)**

*Focus: Connecting the camera to the AI model.*

* **WebSocket Setup (back-end):** Initialize the WebSocket endpoint. Implement the pipeline: JSON \-\> NumPy/Tensor \-\> `model.predict()`.  
* **Camera Integration (front-end):** Implement `getUserMedia` and the camera UI (Instructor vs. User view).  
* **Hand Tracking:** Integrate **MediaPipe** on the frontend to extract keypoints from the video stream.  
* **Real-Time Loop:** Establish the handshake between front-end and back-end to send keypoints and receive `predicted_class` and `confidence_score`.

### **Sprint 4: The Interactive Experience (Quiz & Feedback)**

*Focus: Turning static content into a game.*

* **Quiz Logic (back-end):** Build the dynamic distractor generation (randomly picking wrong answers from the letters table).  
* **Quiz Engine (front-end):** Build the state machine to handle question indexing, scoring, and timers.  
* **Question Components:**  
  * `MultipleChoiceText`  
  * `MultipleChoiceImage`  
  * `TextInput`  
* **Visual Feedback:** Implement green/red success states and Lottie animations for lesson completion.

### **Sprint 5: Progress, Polish & Deployment**

*Focus: Saving data and refining the UX.*

* **Progress Tracking:** Finalize the `user_lesson_progress` API. Ensure quiz scores and AI accuracy are saved to the DB.  
* **Real-Time Refinement:** Fine-tune the accuracy threshold for "passing" a sign-language gesture.  
* **Profile & Stats:** Build the User Profile view to display progress bars and learning statistics.  
* **Optimization:** Configure CORS for production, optimize MUI theme (Primary Orange), and ensure responsive typography across all devices.  
* **Local Deployment:** Final "Local-first" testing of the full stack.

### 4\. API Specification (Core APIs)

#### Authentication APIs

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **POST** | /api/auth/login/google | Login/Register using Google OAuth |
| **POST** | /api/auth/login/facebook | Login/Register using Facebook OAuth |
| **POST** | /api/auth/login/teelgram | Login/Register using Telegram OAuth |
| **POST** | /api/auth/login/guest | Create a temporary guest session |
| **GET** | /api/auth/me | Fetch current user/merchant profile |

#### Learning Platform APIs

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **GET** | /finger\_spelling/units | List all chapters within a specific unit |
| **GET** | /api/finger\_spelling/chapters/{id}/lessons | Fetch all lessons belonging to a chapter |
| **GET** | /api/finger\_spelling/chapters/{id}/lessons | List all lessons within a specific chapter |
| **GET** | /api/finger\_spelling/lessons | List all lessons with basic info |
| **GET** | /api/finger\_spelling/lessons/{id} | Get detail of a specific lesson |
| **GET** | /api/finger\_spelling/lessons/{id}/exercise | Fetch quiz questions for that lesson |
| **POST** | /api/finger\_spelling/lessons/{id}/progress | Update user score and mark as complete |

#### 

#### 

#### 

#### Dictionary APIs

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **GET** | /api/dictionary | Paginated search of words (?search=term) |
| **GET** | /api/dictionary/{id} | Get specific word details/media |

### 2\. Practice (Exercise) APIs

These endpoints power the "Practice" tab in your bottom navigation bar, as well as the quiz/exercise modals that appear during the lesson flow.

| Method | Endpoint | Description |
| ----- | ----- | ----- |
| **GET** | /api/finger\_spelling/chapters/{id}/exercise | Chapter Hub: Lists the available practice chapters (1, 2, 3...) as shown in your "Practice" tab |
| **GET** | /api/finger\_spelling/chapters/{id}/exercise | Quiz Engine: Returns the array of quiz questions (Multiple Choice, Text Input) for a specific lesson |
| **POST** | /api/finger\_spelling/chapters/{id}/exercise/submit | Submit Results: Sends the user's answers and final score to the server for grading |

