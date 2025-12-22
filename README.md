# PlacementIQ - AI Placement Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **AI-powered placement preparation platform for Indian college students**

PlacementIQ helps students prepare for campus placements through AI-powered resume analysis, company eligibility checking, and mock HR interviews. 

⚠️ **Important**: This is a **preparation tool** only. We do NOT guarantee job placements or replicate actual ATS systems.

---

## 🎯 Features

### 1. **Resume Analysis**
- Upload PDF resumes (max 5MB)
- AI-powered feedback on clarity and structure
- Identify strengths and missing sections
- Get actionable improvement suggestions
- **Note**: Not an ATS simulator

### 2. **Company Eligibility Checker**
- Rule-based eligibility checking for:
  - TCS (CGPA ≥ 6.0)
  - Infosys (CGPA ≥ 6.5)
  - Accenture (CGPA ≥ 6.5)
  - Amazon (CGPA ≥ 7.0, CS/IT/ECE preferred)
- Transparent criteria
- Clear eligibility reasoning

### 3. **AI Mock HR Interview**
- Text-based interview practice
- 5 questions per session
- Communication and confidence scoring
- Personalized feedback
- Limited to 3 sessions per day (free tier)

### 4. **Student Dashboard**
- Profile management
- Progress tracking
- Activity history
- Quick access to all features

---

## 🛠️ Tech Stack

### Frontend
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JS
- **HTML5** - Semantic markup
- **CSS3** - Modern, responsive design with CSS variables

### Backend
- **Supabase** - PostgreSQL database, authentication, storage
- **Supabase Edge Functions** - Serverless functions (Deno)

### AI
- **Google Gemini 1.5 Flash** - Latest free model
- Used for text analysis and mock interviews only

### Deployment
- **Vercel / Netlify** - Frontend static hosting
- **Supabase** - Backend and database hosting

---

## 📁 Project Structure

```
PLACEMENT_CONNECT/
├── public/                 # Frontend files
│   ├── index.html         # Landing page
│   ├── login.html         # Login page
│   ├── signup.html        # Signup page
│   ├── dashboard.html     # Student dashboard
│   ├── resume.html        # Resume analysis page
│   ├── eligibility.html   # Company eligibility checker
│   ├── interview.html     # Mock interview page
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   └── js/
│       ├── config.js      # Supabase configuration
│       ├── utils.js       # Utility functions
│       ├── login.js       # Login logic
│       ├── signup.js      # Signup logic
│       ├── dashboard.js   # Dashboard logic
│       ├── resume.js      # Resume analysis logic
│       ├── eligibility.js # Eligibility checker logic
│       └── interview.js   # Mock interview logic
├── supabase/
│   ├── schema.sql         # Database schema
│   └── functions/         # Edge Functions
│       ├── analyze-resume/
│       │   └── index.ts   # Resume analysis function
│       └── mock-interview/
│           └── index.ts   # Mock interview function
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore file
├── package.json           # NPM dependencies
├── vite.config.js         # Vite configuration
├── netlify.toml           # Netlify deployment config
└── README.md              # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier)
- Google Gemini API key (free)

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/placementiq.git
cd placementiq
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Supabase

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to initialize

#### B. Run Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/schema.sql`
3. Execute the SQL script

#### C. Create Storage Bucket
1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `resumes`
3. Set it to **private**
4. Add storage policies (see schema.sql comments)

### 4. Setup Google Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key (free)
3. Copy the API key

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Frontend
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Edge Functions (set in Supabase Dashboard)
GEMINI_API_KEY=your_gemini_api_key
```

**Important**: 
- Get Supabase URL and Anon Key from Project Settings → API
- Set `GEMINI_API_KEY` in Supabase Dashboard → Project Settings → Edge Functions

### 6. Update Frontend Config

Edit `public/js/config.js`:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your_anon_key';
```

Or use environment variables by building with Vite.

### 7. Deploy Edge Functions

Install Supabase CLI:

```bash
npm install -g supabase
```

Login and deploy:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy analyze-resume
supabase functions deploy mock-interview
```

Set environment variables in Supabase Dashboard:
- Project Settings → Edge Functions → Add Secret
- Add: `GEMINI_API_KEY=your_gemini_api_key`

### 8. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📦 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo in Vercel Dashboard.

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Or connect your GitHub repo in Netlify Dashboard.

---

## 🔒 Security & Privacy

### Data Protection
- All user data stored securely in Supabase PostgreSQL
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data

### Authentication
- Secure email/password authentication via Supabase Auth
- Password hashing handled by Supabase
- Optional email confirmation

### Storage
- Resumes stored in private Supabase Storage bucket
- Only accessible by the uploader
- Users can delete their resumes anytime

### AI Usage
- Google Gemini used only for text analysis
- No data training or retention by Gemini
- All AI responses are non-binding guidance

---

## ⚠️ Disclaimers

### What PlacementIQ IS
✅ A preparation and practice tool  
✅ AI-powered feedback system  
✅ Rule-based eligibility checker  
✅ Educational resource  

### What PlacementIQ is NOT
❌ NOT a job placement guarantee  
❌ NOT an actual ATS simulator  
❌ NOT affiliated with any company  
❌ NOT a placement consultancy  

**All AI feedback is for guidance purposes only. Always verify company requirements with your placement cell.**

---

## 🧪 Testing

### Manual Testing Checklist

1. **Authentication**
   - [ ] Sign up with valid credentials
   - [ ] Login with correct credentials
   - [ ] Logout functionality
   - [ ] Profile update

2. **Resume Analysis**
   - [ ] Upload PDF resume
   - [ ] Receive AI feedback
   - [ ] View analysis history
   - [ ] File size validation (max 5MB)

3. **Eligibility Checker**
   - [ ] Check eligibility for TCS
   - [ ] Check eligibility for Infosys
   - [ ] Check eligibility for Accenture
   - [ ] Check eligibility for Amazon
   - [ ] View check history

4. **Mock Interview**
   - [ ] Start interview session
   - [ ] Answer questions
   - [ ] End interview and receive feedback
   - [ ] View session history
   - [ ] Daily limit enforcement (3 sessions)

5. **Dashboard**
   - [ ] View all statistics
   - [ ] Recent activity display
   - [ ] Profile information
   - [ ] Navigation to features

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. PDF text extraction is basic (planned: PDF.js integration)
2. Mock interviews limited to 3 per day (free tier control)
3. Company list limited to 4 companies (easily extensible)
4. No video/audio interview support (text-based only)

### Planned Features (Future)
- [ ] More companies in eligibility checker
- [ ] Advanced PDF parsing with PDF.js
- [ ] Skill-based job recommendations
- [ ] Placement preparation roadmap
- [ ] Interview question bank

---

## 📊 Database Schema

### Tables
- `profiles` - User profile information
- `resumes` - Uploaded resume metadata
- `resume_feedback` - AI analysis results
- `interview_sessions` - Mock interview data
- `company_checks` - Eligibility check history

See `supabase/schema.sql` for complete schema with RLS policies.

---

## 🤝 Contributing

This is a production-ready MVP. Contributions welcome!

### Guidelines
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Code Standards
- Use vanilla JavaScript (no frameworks)
- Comment all complex logic
- Follow existing code style
- Test before submitting PR

---

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 👥 Authors

**PlacementIQ Team**  
Built with ❤️ for Indian college students

---

## 🙏 Acknowledgments

- **Supabase** - Amazing backend-as-a-service
- **Google Gemini** - Free AI API
- **Indian Students** - For whom this platform exists

---

## 📧 Support

For issues and questions:
- Open a GitHub Issue
- Email: support@placementiq.com (if applicable)

---

## ⭐ Star This Project

If this helps you prepare for placements, please star this repository!

---

**Remember**: PlacementIQ helps you PREPARE, not GUARANTEE placements. Your success depends on your hard work and preparation! 💪

