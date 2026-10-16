/* ============================================================
   DAMECOOPER INSTITUTE — PROGRAMMES PAGE
   ------------------------------------------------------------
   Handles:
     • Programme directory (search, filter, pathway switching)
     • Course detail modal
     • Header scroll behaviour
     • Back-to-top button
     • Mobile navigation drawer
     • Swipe-to-dismiss for the course modal
   ============================================================ */

/* ============================================================
   PROGRAMME DATA
   ------------------------------------------------------------
   Two pathways: "academic" and "practical".
   Each programme has enough metadata to power both the card and
   the detail modal. Add new entries here — no other code needs
   to change.
   ============================================================ */
const PROGRAMMES = [
  /* ---------------- ACADEMIC ---------------- */
  {
    id: "bsc-ba",
    code: "BSC-BA",
    title: "Bachelor of Business Administration",
    school: "business",
    schoolLabel: "Business",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "3 years",
    credits: "360 credits",
    description: "Build a strong foundation in management, finance, marketing, and organisational behaviour for a career in business leadership.",
    fullDescription: "The Bachelor of Business Administration provides a comprehensive grounding in modern business practice. You'll study core disciplines including management, accounting, economics, marketing, and organisational behaviour, then choose electives that reflect your career ambitions. Throughout your studies you'll work on real business cases, develop analytical and communication skills, and gain exposure to industry through guest speakers, live projects, and internship opportunities.",
    learn: [
      "Core principles of management, marketing, and organisational behaviour",
      "Financial accounting, management accounting, and business finance",
      "Microeconomics, macroeconomics, and business statistics",
      "Strategic planning, project management, and operations",
      "Business communication, ethics, and professional practice"
    ],
    entry: [
      "NCEA Level 3 or recognised international equivalent",
      "IELTS 6.0 or equivalent for applicants whose first language is not English",
      "Certified copies of academic transcripts",
      "Valid passport or identification"
    ],
    careers: ["Business analyst", "Marketing coordinator", "Operations manager", "Account manager", "Entrepreneur"],
    image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "mba",
    code: "MBA",
    title: "Master of Business Administration",
    school: "business",
    schoolLabel: "Business",
    pathway: "academic",
    level: "postgraduate",
    levelLabel: "Postgraduate",
    mode: "hybrid",
    modeLabel: "Hybrid",
    duration: "18 months",
    credits: "180 credits",
    description: "Advance your leadership career with a strategic, practical MBA designed for working professionals.",
    fullDescription: "Our MBA blends rigorous academic study with real-world application. Designed for experienced professionals, the programme develops strategic thinking, financial acumen, and leadership capability through case-based learning, executive mentoring, and a capstone consultancy project. Choose from electives in strategy, innovation, finance, or operations.",
    learn: [
      "Strategic management and competitive analysis",
      "Corporate finance and managerial economics",
      "Leadership, team dynamics, and organisational change",
      "Marketing strategy and customer insight",
      "Operations, supply chain, and business analytics",
      "Capstone consultancy or research project"
    ],
    entry: [
      "A recognised bachelor's degree in any discipline",
      "At least two years of relevant professional experience",
      "IELTS 6.5 or equivalent",
      "A short statement of purpose and CV"
    ],
    careers: ["General manager", "Consultant", "Director", "Entrepreneur", "Senior analyst"],
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "bsc-cs",
    code: "BSC-CS",
    title: "Bachelor of Computer Science",
    school: "computing",
    schoolLabel: "Computing",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "3 years",
    credits: "360 credits",
    description: "Study algorithms, software engineering, databases, and systems design with hands-on project work throughout.",
    fullDescription: "Computer science at DameCooper equips you with the theoretical foundations and practical skills needed to design, build, and maintain modern software systems. You'll learn programming, data structures, algorithms, operating systems, databases, and software engineering, with the option to specialise in AI, cybersecurity, or distributed systems in your final year.",
    learn: [
      "Programming in Python, Java, and C++",
      "Data structures and algorithm design",
      "Operating systems, networks, and distributed computing",
      "Databases, software engineering, and testing",
      "Artificial intelligence and machine learning fundamentals"
    ],
    entry: [
      "NCEA Level 3 (or equivalent) with strong mathematics",
      "IELTS 6.0 or equivalent",
      "Certified academic transcripts",
      "Some familiarity with programming is recommended but not required"
    ],
    careers: ["Software developer", "Systems engineer", "Data engineer", "DevOps engineer", "QA engineer"],
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "msc-ds",
    code: "MSC-DS",
    title: "Master of Science in Data Science",
    school: "computing",
    schoolLabel: "Computing",
    pathway: "academic",
    level: "postgraduate",
    levelLabel: "Postgraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "18 months",
    credits: "180 credits",
    description: "Learn statistical modelling, machine learning, and data engineering with real-world projects and industry partners.",
    fullDescription: "The MSc in Data Science is an intensive, project-led programme designed for graduates who want to work at the intersection of statistics, computing, and business. You'll cover data wrangling, machine learning, deep learning, big data platforms, and data visualisation, culminating in an industry-sponsored capstone project.",
    learn: [
      "Statistical modelling and inferential methods",
      "Machine learning and deep learning",
      "Data engineering and big data pipelines",
      "Data visualisation and storytelling",
      "Ethics, privacy, and responsible AI"
    ],
    entry: [
      "A bachelor's degree in computing, mathematics, statistics, or a related field",
      "Evidence of programming ability (Python or R preferred)",
      "IELTS 6.5 or equivalent",
      "A short statement of purpose"
    ],
    careers: ["Data scientist", "Machine learning engineer", "Data analyst", "BI specialist", "AI researcher"],
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "beng-civ",
    code: "BENG-CIV",
    title: "Bachelor of Engineering (Civil)",
    school: "engineering",
    schoolLabel: "Engineering",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "4 years",
    credits: "480 credits",
    description: "Design and build infrastructure — from bridges and roads to water systems and sustainable cities.",
    fullDescription: "Civil engineering at DameCooper is a four-year professional pathway covering structural, geotechnical, water, transportation, and environmental engineering. You'll spend significant time in our materials, hydraulics, and structures laboratories, and complete a full-year capstone design project working with real client briefs.",
    learn: [
      "Structural analysis and design",
      "Geotechnical engineering and soil mechanics",
      "Hydraulics, hydrology, and water resources",
      "Transportation engineering and urban planning",
      "Sustainable construction materials and methods"
    ],
    entry: [
      "NCEA Level 3 with strong mathematics and physics, or equivalent",
      "IELTS 6.5 or equivalent",
      "Certified academic transcripts",
      "Recommended: one year of university-level mathematics"
    ],
    careers: ["Civil engineer", "Structural engineer", "Site engineer", "Project engineer", "Infrastructure consultant"],
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "bnurs",
    code: "BNURS",
    title: "Bachelor of Nursing",
    school: "health",
    schoolLabel: "Health Sciences",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "3 years",
    credits: "360 credits",
    description: "Prepare for registration as a nurse with clinical placements, simulation labs, and integrated theory and practice.",
    fullDescription: "The Bachelor of Nursing is a rigorous, clinically focused programme that prepares graduates for registration as a nurse. You'll study anatomy, physiology, pharmacology, and nursing practice across a range of health settings, complemented by more than 1,000 hours of supervised clinical placement.",
    learn: [
      "Anatomy, physiology, and pathophysiology",
      "Pharmacology and medication management",
      "Nursing assessment, planning, and intervention",
      "Cultural safety and Māori health",
      "Clinical reasoning and evidence-based practice"
    ],
    entry: [
      "NCEA Level 3 with biology or chemistry, or equivalent",
      "IELTS 6.5 (no band below 6.5) or equivalent",
      "Police vetting and health screening",
      "Two professional references"
    ],
    careers: ["Registered nurse", "Community health nurse", "Mental health nurse", "Aged care nurse", "Clinical educator"],
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "benv-sci",
    code: "BENV-SCI",
    title: "Bachelor of Environmental Science",
    school: "environmental",
    schoolLabel: "Environmental Science",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "3 years",
    credits: "360 credits",
    description: "Investigate ecosystems, climate, and sustainability through fieldwork, lab work, and applied research.",
    fullDescription: "Environmental science brings together ecology, earth science, chemistry, and data analysis to understand and address environmental challenges. You'll spend significant time in the field, studying Otago's unique coastal, alpine, and agricultural environments alongside laboratory and GIS-based analysis.",
    learn: [
      "Ecology and biodiversity conservation",
      "Climate science and environmental change",
      "Soil, water, and atmospheric systems",
      "Geographic information systems (GIS)",
      "Environmental policy and management"
    ],
    entry: [
      "NCEA Level 3 with a science subject, or equivalent",
      "IELTS 6.0 or equivalent",
      "Certified academic transcripts",
      "Physical fitness for fieldwork recommended"
    ],
    careers: ["Environmental scientist", "Conservation officer", "Sustainability analyst", "GIS specialist", "Policy advisor"],
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "bcom-design",
    code: "BCOM-DES",
    title: "Bachelor of Communication Design",
    school: "creative",
    schoolLabel: "Creative Arts",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "3 years",
    credits: "360 credits",
    description: "Combine visual design, digital media, and storytelling to shape how ideas move through the world.",
    fullDescription: "Communication Design is a studio-based programme for students who want to work across graphic design, digital media, branding, and user experience. You'll build a portfolio of real-world projects, learn industry-standard software, and develop your own visual voice under the guidance of practising designers.",
    learn: [
      "Typography, layout, and visual systems",
      "Brand identity and strategic design",
      "Digital media production and motion design",
      "User experience and interface design",
      "Portfolio development and professional practice"
    ],
    entry: [
      "NCEA Level 3 or equivalent",
      "IELTS 6.0 or equivalent",
      "A portfolio of creative work (recommended)",
      "A short statement of intent"
    ],
    careers: ["Graphic designer", "Brand designer", "UX/UI designer", "Art director", "Digital content creator"],
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "bed",
    code: "BED",
    title: "Bachelor of Education Studies",
    school: "education",
    schoolLabel: "Education",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "3 years",
    credits: "360 credits",
    description: "Study learning, teaching, and educational leadership across early childhood, primary, and adult education.",
    fullDescription: "The Bachelor of Education Studies offers a broad and flexible route into education. You'll study learning theory, curriculum design, assessment, and educational policy, with the option to specialise in early childhood, primary, or adult and community education. Field placements are integrated throughout the programme.",
    learn: [
      "Learning theory and child development",
      "Curriculum design and assessment practice",
      "Educational policy and the New Zealand context",
      "Inclusive and culturally responsive teaching",
      "Digital learning and educational technology"
    ],
    entry: [
      "NCEA Level 3 or equivalent",
      "IELTS 7.0 (no band below 7.0) for teaching registration pathways",
      "Police vetting",
      "Two professional references"
    ],
    careers: ["Education advisor", "Curriculum developer", "Learning designer", "Community educator", "Policy analyst"],
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "llb",
    code: "LLB",
    title: "Bachelor of Laws",
    school: "law",
    schoolLabel: "Law & Social Sciences",
    pathway: "academic",
    level: "undergraduate",
    levelLabel: "Undergraduate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "4 years",
    credits: "480 credits",
    description: "Study legal systems, reasoning, and practice across public, private, and international law.",
    fullDescription: "The Bachelor of Laws is a four-year professional pathway into the legal profession and a wide range of related fields. You'll study constitutional law, contracts, torts, criminal law, property, and equity, alongside electives in international law, human rights, environmental law, and commercial practice.",
    learn: [
      "Legal systems, reasoning, and method",
      "Constitutional, criminal, and contract law",
      "Property, equity, and trusts",
      "International law and human rights",
      "Legal research, writing, and advocacy"
    ],
    entry: [
      "NCEA Level 3 with strong English, or equivalent",
      "IELTS 7.0 or equivalent",
      "Certified academic transcripts",
      "An entrance interview may be required"
    ],
    careers: ["Solicitor", "Barrister (with further qualification)", "Policy analyst", "Legal advisor", "Compliance officer"],
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80"
  },

  /* ---------------- PRACTICAL ---------------- */
  {
    id: "cert-care",
    code: "CERT-CARE",
    title: "Certificate in Caregiving & Home-Based Care",
    school: "caregiving",
    schoolLabel: "Caregiving",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "hybrid",
    modeLabel: "Hybrid",
    duration: "6 months",
    credits: "60 credits",
    description: "Prepare for a career in home-based care, aged support, and disability assistance.",
    fullDescription: "This practical certificate introduces the skills, knowledge, and professional conduct required to work safely and compassionately in home-based and aged care settings. It combines classroom learning with supervised placement experience, and is suitable for people entering the care sector for the first time.",
    learn: [
      "Personal care, hygiene, and mobility support",
      "Communication with clients, families, and colleagues",
      "Infection prevention and safe practice",
      "Safeguarding and duty of care",
      "Documentation and reporting basics"
    ],
    entry: [
      "Basic secondary education or equivalent",
      "Basic literacy and numeracy",
      "Aged care health screening and police vetting",
      "No prior caregiving experience required"
    ],
    careers: ["Caregiver", "Home support worker", "Aged care assistant", "Disability support worker"],
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-aged",
    code: "CERT-AGED",
    title: "Certificate in Aged & Disability Support",
    school: "caregiving",
    schoolLabel: "Caregiving",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "9 months",
    credits: "90 credits",
    description: "Build on fundamental caregiving skills with specialist training in aged and disability support.",
    fullDescription: "This certificate extends introductory caregiving training with a focus on the needs of older adults and people living with disabilities. You'll learn person-centred planning, dementia awareness, restorative care approaches, and how to work effectively within a multidisciplinary team.",
    learn: [
      "Person-centred support planning",
      "Dementia and cognitive change awareness",
      "Restorative and reablement care approaches",
      "Assistive equipment and safe transfers",
      "Working within a care team"
    ],
    entry: [
      "Basic secondary education or equivalent",
      "Police vetting and health screening",
      "Preference for candidates with some care experience",
      "Physical fitness for safe manual handling"
    ],
    careers: ["Aged care support worker", "Disability support worker", "Residential care assistant", "Community support worker"],
    image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "short-nanny",
    code: "SHORT-NANNY",
    title: "Professional Nanny & Childcare",
    school: "caregiving",
    schoolLabel: "Caregiving",
    pathway: "practical",
    level: "short-course",
    levelLabel: "Short Course",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "8 weeks",
    credits: "Non-credit",
    description: "Develop professional childcare skills for work as a nanny, family assistant, or home-based educator.",
    fullDescription: "A focused, practical short course for people who want to work as a professional nanny, family assistant, or home-based childcare provider. Covers child development, nutrition, first aid, safeguarding, and professional conduct in a family setting.",
    learn: [
      "Child development from infancy to school age",
      "Age-appropriate play and learning activities",
      "Nutrition, meal preparation, and mealtime routines",
      "First aid and emergency response for children",
      "Professional communication with families"
    ],
    entry: [
      "Basic secondary education",
      "Police vetting and references",
      "A genuine interest in working with children",
      "No prior experience required"
    ],
    careers: ["Nanny", "Family assistant", "Home-based educator", "Before/after-school carer"],
    image: "https://images.unsplash.com/photo-1544776193-352d25ca82cd?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-hsk",
    code: "CERT-HSK",
    title: "Certificate in Professional Housekeeping",
    school: "housekeeping",
    schoolLabel: "Housekeeping",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "3 months",
    credits: "40 credits",
    description: "Train for professional housekeeping roles in hotels, serviced apartments, and private residences.",
    fullDescription: "This certificate delivers the technical and customer-service skills needed for professional housekeeping in hospitality and residential settings. You'll learn industry-standard procedures, safe chemical handling, linen management, and attention to detail that guests and clients expect.",
    learn: [
      "Room preparation and bed-making standards",
      "Bathroom cleaning and sanitisation",
      "Linen, laundry, and stock management",
      "Safe handling of cleaning products and equipment",
      "Guest privacy and professional conduct"
    ],
    entry: [
      "Basic literacy and numeracy",
      "No prior experience required",
      "Physical fitness for practical work",
      "Friendly, professional manner"
    ],
    careers: ["Housekeeper", "Room attendant", "Housekeeping supervisor", "Private residence housekeeper"],
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-clean",
    code: "CERT-CLEAN",
    title: "Certificate in Commercial Cleaning",
    school: "housekeeping",
    schoolLabel: "Housekeeping",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "4 months",
    credits: "50 credits",
    description: "Prepare for commercial, industrial, and office cleaning roles with certified skills and safety training.",
    fullDescription: "Commercial cleaning is a growing industry with strong demand across offices, schools, healthcare facilities, and industrial sites. This certificate covers cleaning methods, chemical safety, equipment operation, and workplace hygiene standards.",
    learn: [
      "Commercial cleaning methods and schedules",
      "Chemical handling and workplace safety",
      "Equipment operation and maintenance",
      "Infection control in public spaces",
      "Customer service and professional conduct"
    ],
    entry: [
      "Basic literacy and numeracy",
      "No prior experience required",
      "Physical fitness for practical work",
      "Police vetting for certain work sites"
    ],
    careers: ["Commercial cleaner", "Hygiene technician", "Facilities assistant", "Cleaning supervisor"],
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-hosp",
    code: "CERT-HOSP",
    title: "Certificate in Hospitality Operations",
    school: "hospitality",
    schoolLabel: "Hospitality",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "on-campus",
    modeLabel: "On campus",
    duration: "6 months",
    credits: "60 credits",
    description: "Learn front-of-house, food and beverage, and accommodation skills for a career in hospitality.",
    fullDescription: "This hands-on certificate prepares you for a range of hospitality roles across hotels, restaurants, cafés, and event venues. Delivered in our on-campus training restaurant and front desk, the programme develops the service standards, communication skills, and practical confidence employers look for.",
    learn: [
      "Food and beverage service standards",
      "Front office and reception operations",
      "Food safety and hygiene (NZ standards)",
      "Customer service and guest relations",
      "Barista and beverage preparation"
    ],
    entry: [
      "Basic secondary education or equivalent",
      "No prior experience required",
      "Friendly, professional manner",
      "Aged 16 or over"
    ],
    careers: ["Front office agent", "Food and beverage attendant", "Barista", "Event staff", "Hotel receptionist"],
    image: "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "short-barista",
    code: "SHORT-BARISTA",
    title: "Barista & Coffee Preparation",
    school: "hospitality",
    schoolLabel: "Hospitality",
    pathway: "practical",
    level: "short-course",
    levelLabel: "Short Course",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "2 weeks",
    credits: "Non-credit",
    description: "Master the art of coffee — espresso extraction, milk texturing, and café service in just two weeks.",
    fullDescription: "A fast, focused short course that will equip you to work confidently as a barista in cafés, restaurants, or mobile coffee operations. Covers espresso technique, milk texturing, drink recipes, machine maintenance, and café customer service.",
    learn: [
      "Espresso extraction and grind adjustment",
      "Milk texturing and latte art basics",
      "Standard café drink recipes",
      "Machine cleaning and maintenance",
      "Speed, consistency, and customer service"
    ],
    entry: [
      "No prior experience required",
      "Basic literacy and numeracy",
      "Aged 16 or over"
    ],
    careers: ["Barista", "Café all-rounder", "Coffee cart operator"],
    image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-farm",
    code: "CERT-FARM",
    title: "Certificate in Farm Operations",
    school: "agriculture",
    schoolLabel: "Agriculture",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "workplace",
    modeLabel: "Workplace-based",
    duration: "9 months",
    credits: "80 credits",
    description: "Develop practical farming skills for work on dairy, sheep, beef, or mixed-use farms.",
    fullDescription: "This workplace-based certificate prepares you for employment on New Zealand farms. Delivered largely on-farm under supervision, the programme covers livestock handling, pasture management, machinery operation, and farm safety.",
    learn: [
      "Livestock handling and animal welfare",
      "Pasture and crop management basics",
      "Tractor and farm machinery operation",
      "Farm safety and hazard management",
      "Record keeping and farm reporting"
    ],
    entry: [
      "Basic literacy and numeracy",
      "Physical fitness for outdoor work",
      "A valid driver licence is an advantage",
      "A placement on a partner farm is required"
    ],
    careers: ["Farm assistant", "Dairy assistant", "Stock handler", "General farm hand"],
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-elec",
    code: "CERT-ELEC",
    title: "Electrical Installation Foundations",
    school: "trades",
    schoolLabel: "Trades",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Pre-Apprenticeship",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "6 months",
    credits: "70 credits",
    description: "Start your electrical career with foundational training that leads into an apprenticeship.",
    fullDescription: "A pre-apprenticeship programme that gives you the theory, tool skills, and workplace awareness needed to enter an electrical apprenticeship. Delivered in our training workshop with supervised practical exercises and safety instruction throughout.",
    learn: [
      "Electrical theory and safe practice",
      "Wiring, circuits, and testing fundamentals",
      "Tool use and workshop safety",
      "Reading electrical drawings",
      "Workplace conduct and communication"
    ],
    entry: [
      "NCEA Level 1 or equivalent",
      "Basic mathematics",
      "Physical fitness and manual dexterity",
      "Aged 16 or over"
    ],
    careers: ["Electrical apprentice", "Electrical trade assistant", "Solar installation assistant"],
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-plumb",
    code: "CERT-PLUMB",
    title: "Plumbing & Pipefitting Foundations",
    school: "trades",
    schoolLabel: "Trades",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Pre-Apprenticeship",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "6 months",
    credits: "70 credits",
    description: "Build practical skills in plumbing, pipefitting, and drainage — a direct pathway into apprenticeship.",
    fullDescription: "This pre-apprenticeship programme introduces the tools, materials, and techniques used in residential and commercial plumbing. You'll work on real installations in our training workshop and gain the foundational knowledge needed for an apprenticeship.",
    learn: [
      "Plumbing tools and materials",
      "Pipe fitting, soldering, and joining techniques",
      "Drainage and water supply basics",
      "Workshop safety and code awareness",
      "Reading plumbing plans"
    ],
    entry: [
      "NCEA Level 1 or equivalent",
      "Basic mathematics",
      "Physical fitness for manual work",
      "Aged 16 or over"
    ],
    careers: ["Plumbing apprentice", "Trade assistant", "Drainage assistant"],
    image: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-sec",
    code: "CERT-SEC",
    title: "Certificate in Security & Site Operations",
    school: "security",
    schoolLabel: "Security",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "hybrid",
    modeLabel: "Hybrid",
    duration: "4 months",
    credits: "50 credits",
    description: "Prepare for gatehouse, patrol, and site security roles with certified training.",
    fullDescription: "This certificate prepares you for entry-level security roles in commercial, industrial, and event settings. Covers access control, patrol procedures, incident reporting, de-escalation, and emergency response. Delivered via classroom and practical simulation.",
    learn: [
      "Access control and visitor management",
      "Patrol techniques and observation skills",
      "Incident reporting and documentation",
      "Conflict de-escalation and communication",
      "Emergency procedures and first aid awareness"
    ],
    entry: [
      "Basic literacy and communication",
      "Police vetting and clean criminal record",
      "Physical fitness for patrol duties",
      "Aged 18 or over"
    ],
    careers: ["Security officer", "Gatehouse attendant", "Event security staff", "Loss prevention assistant"],
    image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-office",
    code: "CERT-OFFICE",
    title: "Certificate in Office Administration",
    school: "office",
    schoolLabel: "Office Admin",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "hybrid",
    modeLabel: "Hybrid",
    duration: "5 months",
    credits: "55 credits",
    description: "Develop the office, digital, and customer service skills every workplace needs.",
    fullDescription: "This certificate covers the essential administrative, digital, and communication skills required in modern offices. You'll learn Microsoft Office, records management, customer service, reception duties, and basic bookkeeping — all with a strong focus on practical application.",
    learn: [
      "Microsoft Word, Excel, and Outlook",
      "Records management and filing systems",
      "Customer service and reception duties",
      "Business writing and communication",
      "Basic bookkeeping and invoicing"
    ],
    entry: [
      "Basic literacy and numeracy",
      "No prior office experience required",
      "Comfortable using a computer",
      "Aged 16 or over"
    ],
    careers: ["Administration assistant", "Receptionist", "Data entry operator", "Office coordinator"],
    image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "short-cust",
    code: "SHORT-CUST",
    title: "Customer Service Essentials",
    school: "office",
    schoolLabel: "Office Admin",
    pathway: "practical",
    level: "short-course",
    levelLabel: "Short Course",
    mode: "online",
    modeLabel: "Online",
    duration: "3 weeks",
    credits: "Non-credit",
    description: "Master the communication and problem-solving skills that every customer-facing role requires.",
    fullDescription: "This online short course builds the communication, empathy, and problem-solving skills needed in customer service roles across retail, hospitality, call centres, and online support. Delivered over three weeks with short daily modules.",
    learn: [
      "Professional communication in person and online",
      "Handling difficult customers and complaints",
      "Problem-solving and escalation",
      "Customer service software fundamentals",
      "Personal resilience and self-care"
    ],
    entry: [
      "Basic English literacy",
      "Comfortable using a computer",
      "No prior experience required"
    ],
    careers: ["Customer service representative", "Retail assistant", "Call centre operator", "Online support agent"],
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "cert-whse",
    code: "CERT-WHSE",
    title: "Certificate in Warehouse Operations",
    school: "logistics",
    schoolLabel: "Logistics",
    pathway: "practical",
    level: "certificate",
    levelLabel: "Certificate",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "4 months",
    credits: "50 credits",
    description: "Train for warehouse, distribution, and logistics roles with practical, employer-ready skills.",
    fullDescription: "This practical certificate prepares you for roles in warehouses, distribution centres, and logistics operations. Covers pick-and-pack, inventory systems, dispatch, safety, and forklift theory (licensing separate).",
    learn: [
      "Picking, packing, and dispatch procedures",
      "Inventory systems and stock control",
      "Warehouse safety and hazard awareness",
      "Forklift theory and safe operation principles",
      "Documentation and logistics basics"
    ],
    entry: [
      "Basic literacy and numeracy",
      "Physical fitness for warehouse work",
      "No prior experience required",
      "Aged 16 or over"
    ],
    careers: ["Warehouse assistant", "Picker/packer", "Dispatch operator", "Inventory clerk"],
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80"
  },
  {
    id: "short-carg",
    code: "SHORT-CARG",
    title: "Car Grooming & Detailing",
    school: "personal",
    schoolLabel: "Personal Services",
    pathway: "practical",
    level: "short-course",
    levelLabel: "Short Course",
    mode: "workshop",
    modeLabel: "Workshop",
    duration: "3 weeks",
    credits: "Non-credit",
    description: "Learn professional vehicle cleaning, polishing, and detailing for work in automotive and rental industries.",
    fullDescription: "A hands-on short course covering every aspect of professional car grooming — from interior detailing and paint correction to waxing and finishing. Ideal for anyone seeking work with car dealerships, rental companies, or as a mobile detailer.",
    learn: [
      "Interior cleaning and detailing techniques",
      "Exterior washing, polishing, and waxing",
      "Paint correction and scratch removal",
      "Product knowledge and safe chemical handling",
      "Customer service and mobile detailing setup"
    ],
    entry: [
      "No prior experience required",
      "Basic literacy",
      "Aged 16 or over"
    ],
    careers: ["Car groomer", "Detailing technician", "Mobile detailer", "Rental fleet assistant"],
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80"
  }
];

/* ============================================================
   PATHWAY CONFIG
   ============================================================ */
const PATHWAYS = {
  academic: {
    label: "Academic Programmes",
    eyebrow: "Academic Programmes",
    levels: [
      { value: "undergraduate", label: "Undergraduate" },
      { value: "postgraduate", label: "Postgraduate" },
      { value: "doctoral", label: "Doctoral" }
    ]
  },
  practical: {
    label: "Practical Career Programmes",
    eyebrow: "Practical Career Programmes",
    levels: [
      { value: "short-course", label: "Short Course" },
      { value: "certificate", label: "Certificate / Pre-Apprenticeship" },
      { value: "apprenticeship", label: "Apprenticeship Pathway" }
    ]
  }
};

/* ============================================================
   DIRECTORY ENGINE
   ============================================================ */
(function directory() {
  const state = {
    pathway: "academic",
    query: "",
    school: "",
    level: "",
    mode: ""
  };

  const dom = {
    grid: document.getElementById("programmeGrid"),
    search: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    school: document.getElementById("schoolFilter"),
    level: document.getElementById("levelFilter"),
    mode: document.getElementById("modeFilter"),
    reset: document.getElementById("filterReset"),
    count: document.getElementById("resultsCount"),
    filterToggle: document.getElementById("filterToggle"),
    filterFields: document.getElementById("filterFields"),
    eyebrow: document.getElementById("directoryEyebrow"),
    title: document.getElementById("directory-title"),
    tabs: document.querySelectorAll(".pathway-tab")
  };

  /* ------------------ Helpers ------------------ */
  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function levelClass(level) {
    const map = {
      "undergraduate": "undergraduate",
      "postgraduate": "postgraduate",
      "doctoral": "doctoral",
      "certificate": "certificate",
      "short-course": "short-course",
      "apprenticeship": "apprenticeship"
    };
    return map[level] || "certificate";
  }

  /* ------------------ Data access ------------------ */
  function programmesForPathway(pathway) {
    return PROGRAMMES.filter(function (p) { return p.pathway === pathway; });
  }

  function schoolsForPathway(pathway) {
    const set = new Map();
    programmesForPathway(pathway).forEach(function (p) {
      if (!set.has(p.school)) {
        set.set(p.school, p.schoolLabel);
      }
    });
    return Array.from(set.entries()).map(function (entry) {
      return { value: entry[0], label: entry[1] };
    }).sort(function (a, b) {
      return a.label.localeCompare(b.label);
    });
  }

  function matches(programme) {
    if (programme.pathway !== state.pathway) return false;
    if (state.query) {
      const haystack = [
        programme.title,
        programme.code,
        programme.schoolLabel,
        programme.description,
        programme.levelLabel
      ].join(" ").toLowerCase();
      if (!haystack.includes(state.query)) return false;
    }
    if (state.school && programme.school !== state.school) return false;
    if (state.level && programme.level !== state.level) return false;
    if (state.mode && programme.mode !== state.mode) return false;
    return true;
  }

  /* ------------------ Populate filters ------------------ */
  function populateSchoolFilter() {
    const previous = state.school;
    const schools = schoolsForPathway(state.pathway);
    dom.school.innerHTML = '<option value="">All schools</option>' +
      schools.map(function (s) {
        return '<option value="' + escapeHTML(s.value) + '">' + escapeHTML(s.label) + '</option>';
      }).join("");

    const stillValid = schools.some(function (s) { return s.value === previous; });
    state.school = stillValid ? previous : "";
    dom.school.value = state.school;
  }

  function populateLevelFilter() {
    const previous = state.level;
    const levels = PATHWAYS[state.pathway].levels;
    dom.level.innerHTML = '<option value="">All levels</option>' +
      levels.map(function (l) {
        return '<option value="' + escapeHTML(l.value) + '">' + escapeHTML(l.label) + '</option>';
      }).join("");

    const stillValid = levels.some(function (l) { return l.value === previous; });
    state.level = stillValid ? previous : "";
    dom.level.value = state.level;
  }

  /* ------------------ Render ------------------ */
  function renderCard(p) {
    return (
      '<article class="programme-card" data-aos="fade-up">' +
        '<div class="programme-card-image">' +
          '<span class="programme-card-tag">' + escapeHTML(p.schoolLabel) + '</span>' +
          '<img src="' + escapeHTML(p.image) + '" alt="' + escapeHTML(p.title) + '" width="800" height="500" loading="lazy" />' +
        '</div>' +
        '<div class="programme-card-body">' +
          '<div class="programme-card-meta">' +
            '<span>' + escapeHTML(p.levelLabel) + '</span>' +
            '<span class="programme-code">' + escapeHTML(p.code) + '</span>' +
          '</div>' +
          '<h3 class="programme-card-title">' + escapeHTML(p.title) + '</h3>' +
          '<p class="programme-card-desc">' + escapeHTML(p.description) + '</p>' +
          '<div class="programme-card-details">' +
            '<span class="programme-card-detail"><i class="fas fa-clock" aria-hidden="true"></i>' + escapeHTML(p.duration) + '</span>' +
            '<span class="programme-card-detail"><i class="fas fa-laptop" aria-hidden="true"></i>' + escapeHTML(p.modeLabel) + '</span>' +
          '</div>' +
          '<div class="programme-card-footer">' +
            '<span class="programme-level-badge ' + levelClass(p.level) + '">' + escapeHTML(p.levelLabel) + '</span>' +
            '<button type="button" class="programme-view-btn" data-course-id="' + escapeHTML(p.id) + '" aria-label="View details for ' + escapeHTML(p.title) + '">' +
              'View details <i class="fas fa-arrow-right" aria-hidden="true"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function render() {
    const filtered = PROGRAMMES.filter(matches);

    const config = PATHWAYS[state.pathway];
    if (dom.eyebrow) dom.eyebrow.textContent = config.eyebrow;
    if (dom.title) {
      dom.title.textContent = state.pathway === "academic"
        ? "Browse academic programmes."
        : "Browse practical career programmes.";
    }

    const noun = filtered.length === 1 ? "programme" : "programmes";
    dom.count.innerHTML = "<strong>" + filtered.length + "</strong> " + noun + " available";

    if (!filtered.length) {
      dom.grid.innerHTML =
        '<div class="empty-state">' +
          '<i class="fas fa-magnifying-glass" aria-hidden="true"></i>' +
          '<h3>No programmes match your filters</h3>' +
          '<p>Try adjusting your search terms or resetting the filters to see all available programmes.</p>' +
          '<button type="button" class="btn btn-gold" id="emptyStateReset">' +
            'Reset filters <i class="fas fa-rotate-left" aria-hidden="true"></i>' +
          '</button>' +
        '</div>';
      const emptyReset = document.getElementById("emptyStateReset");
      if (emptyReset) emptyReset.addEventListener("click", resetFilters);
      return;
    }

    dom.grid.innerHTML = filtered.map(renderCard).join("");

    if (window.AOS && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      AOS.refresh();
    }
  }

  /* ------------------ Search clear ------------------ */
  function updateSearchClear() {
    if (dom.search.value.trim()) {
      dom.searchClear.classList.add("show");
    } else {
      dom.searchClear.classList.remove("show");
    }
  }

  /* ------------------ Reset ------------------ */
  function resetFilters() {
    state.query = "";
    state.school = "";
    state.level = "";
    state.mode = "";
    dom.search.value = "";
    dom.school.value = "";
    dom.level.value = "";
    dom.mode.value = "";
    updateSearchClear();
    render();
  }

  /* ------------------ Pathway switch ------------------ */
  function switchPathway(pathway) {
    if (!PATHWAYS[pathway]) return;
    state.pathway = pathway;

    state.query = "";
    state.school = "";
    state.level = "";
    state.mode = "";
    dom.search.value = "";
    dom.mode.value = "";
    updateSearchClear();

    dom.tabs.forEach(function (tab) {
      const isActive = tab.dataset.pathway === pathway;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    populateSchoolFilter();
    populateLevelFilter();

    render();
  }

  /* ------------------ Bind ------------------ */
  function bind() {
    let searchTimer;
    dom.search.addEventListener("input", function () {
      clearTimeout(searchTimer);
      const value = this.value.trim().toLowerCase();
      updateSearchClear();
      searchTimer = setTimeout(function () {
        state.query = value;
        render();
      }, 180);
    });

    dom.searchClear.addEventListener("click", function () {
      dom.search.value = "";
      state.query = "";
      updateSearchClear();
      dom.search.focus();
      render();
    });

    dom.school.addEventListener("change", function () {
      state.school = this.value;
      render();
    });
    dom.level.addEventListener("change", function () {
      state.level = this.value;
      render();
    });
    dom.mode.addEventListener("change", function () {
      state.mode = this.value;
      render();
    });

    dom.reset.addEventListener("click", resetFilters);

    if (dom.filterToggle && dom.filterFields) {
      dom.filterToggle.addEventListener("click", function () {
        const isOpen = dom.filterFields.classList.toggle("open");
        this.setAttribute("aria-expanded", isOpen ? "true" : "false");
        const icon = this.querySelector(".fa-chevron-down, .fa-chevron-up");
        if (icon) {
          icon.classList.toggle("fa-chevron-down", !isOpen);
          icon.classList.toggle("fa-chevron-up", isOpen);
        }
      });
    }

    dom.tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        switchPathway(this.dataset.pathway);
      });
    });

    document.querySelectorAll("[data-filter-school]").forEach(function (link) {
      link.addEventListener("click", function () {
        const school = this.dataset.filterSchool;
        if (!school) return;

        if (state.pathway !== "academic") {
          switchPathway("academic");
        }

        resetFilters();
        state.school = school;
        dom.school.value = school;

        if (window.innerWidth <= 768 && dom.filterFields) {
          dom.filterFields.classList.add("open");
          if (dom.filterToggle) {
            dom.filterToggle.setAttribute("aria-expanded", "true");
            const icon = dom.filterToggle.querySelector(".fa-chevron-down, .fa-chevron-up");
            if (icon) {
              icon.classList.remove("fa-chevron-down");
              icon.classList.add("fa-chevron-up");
            }
          }
        }

        render();

        const directory = document.getElementById("directory");
        if (directory) {
          const headerOffset = 140;
          const targetPos =
            directory.getBoundingClientRect().top + window.scrollY - headerOffset;
          window.scrollTo({ top: targetPos, behavior: "smooth" });
        }
      });
    });

    dom.grid.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-course-id]");
      if (!btn) return;
      const id = btn.dataset.courseId;
      if (id) {
        window.CourseModal.open(id);
      }
    });
  }

  /* ------------------ Init ------------------ */
  function init() {
    populateSchoolFilter();
    populateLevelFilter();
    bind();
    render();
  }

  init();
})();

/* ============================================================
   COURSE DETAIL MODAL
   ============================================================ */
window.CourseModal = (function () {
  const dom = {
    overlay: document.getElementById("courseModal"),
    close: document.getElementById("courseModalClose"),
    cancel: document.getElementById("courseModalCancel"),
    apply: document.getElementById("courseModalApply"),
    image: document.getElementById("courseModalImage"),
    tag: document.getElementById("courseModalTag"),
    tagText: document.getElementById("courseModalTagText"),
    title: document.getElementById("courseModalTitle"),
    code: document.getElementById("courseModalCode"),
    school: document.getElementById("courseModalSchool"),
    duration: document.getElementById("courseModalDuration"),
    level: document.getElementById("courseModalLevel"),
    mode: document.getElementById("courseModalMode"),
    description: document.getElementById("courseModalDescription"),
    learn: document.getElementById("courseModalLearn"),
    entry: document.getElementById("courseModalEntry"),
    careers: document.getElementById("courseModalCareers"),
    learnSection: document.getElementById("courseModalLearnSection"),
    entrySection: document.getElementById("courseModalEntrySection"),
    careersSection: document.getElementById("courseModalCareersSection")
  };

  let lastFocused = null;
  let currentCourse = null;

  function escapeHTML(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function findById(id) {
    return PROGRAMMES.find(function (p) { return p.id === id; });
  }

  function buildApplyUrl(course) {
    const params = new URLSearchParams();
    params.set("programme", course.code);
    params.set("title", course.title);
    params.set("school", course.school);
    params.set("level", course.level);
    params.set("mode", course.mode);
    params.set("pathway", course.pathway);
    return "apply.html?" + params.toString();
  }

  function open(courseId) {
    const course = findById(courseId);
    if (!course) return;

    currentCourse = course;
    lastFocused = document.activeElement;

    dom.image.src = course.image;
    dom.image.alt = course.title;

    dom.tag.className = "course-modal-tag";
    dom.tag.innerHTML =
      '<i class="fas ' + (course.pathway === "academic" ? "fa-graduation-cap" : "fa-tools") + '" aria-hidden="true"></i>' +
      '<span id="courseModalTagText">' + (course.pathway === "academic" ? "Academic" : "Practical") + '</span>';

    dom.title.textContent = course.title;
    dom.code.textContent = course.code;

    dom.school.textContent = course.schoolLabel;
    dom.duration.textContent = course.duration;
    dom.level.textContent = course.levelLabel;
    dom.mode.textContent = course.modeLabel;

    dom.description.textContent = course.fullDescription || course.description;

    if (course.learn && course.learn.length) {
      dom.learn.innerHTML = course.learn.map(function (item) {
        return '<li><i class="fas fa-check" aria-hidden="true"></i><span>' + escapeHTML(item) + '</span></li>';
      }).join("");
      dom.learnSection.style.display = "";
    } else {
      dom.learnSection.style.display = "none";
    }

    if (course.entry && course.entry.length) {
      dom.entry.innerHTML = course.entry.map(function (item) {
        return '<li><i class="fas fa-circle-dot" aria-hidden="true"></i><span>' + escapeHTML(item) + '</span></li>';
      }).join("");
      dom.entrySection.style.display = "";
    } else {
      dom.entrySection.style.display = "none";
    }

    if (course.careers && course.careers.length) {
      dom.careers.innerHTML = course.careers.map(function (career) {
        return '<span class="career-tag"><i class="fas fa-briefcase" aria-hidden="true"></i>' + escapeHTML(career) + '</span>';
      }).join("");
      dom.careersSection.style.display = "";
    } else {
      dom.careersSection.style.display = "none";
    }

    dom.apply.href = buildApplyUrl(course);

    dom.overlay.classList.add("show");
    dom.overlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    /* Reset scroll on both possible scroll containers.
       Desktop scrolls the overlay; mobile scrolls the body. */
    dom.overlay.scrollTop = 0;
    const modalBody = dom.overlay.querySelector(".course-modal-body");
    if (modalBody) modalBody.scrollTop = 0;

    setTimeout(function () { dom.close.focus(); }, 350);

    document.addEventListener("keydown", onKeydown);
  }

  function close() {
    dom.overlay.classList.remove("show");
    dom.overlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    currentCourse = null;
    document.removeEventListener("keydown", onKeydown);

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus();
    }
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Tab") {
      const focusables = dom.overlay.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  dom.close.addEventListener("click", close);
  dom.cancel.addEventListener("click", close);
  dom.overlay.addEventListener("click", function (e) {
    if (e.target === dom.overlay) close();
  });

  return { open: open, close: close };
})();

/* ============================================================
   HEADER SCROLL + BACK TO TOP
   ============================================================ */
(function scrollEffects() {
  const header = document.getElementById("siteHeader");
  const backToTop = document.getElementById("backToTop");
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    if (header) {
      if (y > 20) header.classList.add("scrolled");
      else header.classList.remove("scrolled");
    }
    if (backToTop) {
      if (y > 400) backToTop.classList.add("visible");
      else backToTop.classList.remove("visible");
    }
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();

/* ============================================================
   MOBILE NAVIGATION
   ============================================================ */
(function mobileNav() {
  const toggle = document.getElementById("menuToggle");
  const close = document.getElementById("menuClose");
  const nav = document.getElementById("mobileNav");
  const overlay = document.getElementById("navOverlay");
  const links = nav.querySelectorAll("a");
  const body = document.body;

  function open() {
    nav.classList.add("open");
    overlay.classList.add("active");
    nav.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    body.style.overflow = "hidden";
    close.focus();
  }
  function closeNav() {
    nav.classList.remove("open");
    overlay.classList.remove("active");
    nav.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    body.style.overflow = "";
    toggle.focus();
  }

  toggle.addEventListener("click", open);
  close.addEventListener("click", closeNav);
  overlay.addEventListener("click", closeNav);
  links.forEach(function (link) { link.addEventListener("click", closeNav); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("open")) closeNav();
  });

  nav.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || !nav.classList.contains("open")) return;
    const focusables = nav.querySelectorAll('a[href], button:not([disabled])');
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
})();

/* ============================================================
   CURRENT YEAR
   ============================================================ */
(function () {
  const el = document.getElementById("currentYear");
  if (el) el.textContent = new Date().getFullYear();
})();

/* ============================================================
   AOS
   ============================================================ */
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  AOS.init({
    duration: 700,
    easing: "ease-out-cubic",
    once: true,
    offset: 80
  });
}

/* ============================================================
   SWIPE-DOWN-TO-DISMISS (mobile only)
   ------------------------------------------------------------
   Swipe down on the modal hero image to dismiss the sheet.
   The width check runs at touch time so it works after a
   resize or rotation.
   ============================================================ */
(function enableSwipeToDismiss() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const overlay = document.getElementById("courseModal");
  const sheet = overlay && overlay.querySelector(".course-modal");
  const hero = overlay && overlay.querySelector(".course-modal-hero");
  if (!overlay || !sheet || !hero) return;

  let startY = 0;
  let currentY = 0;
  let dragging = false;

  hero.addEventListener("touchstart", function (e) {
    if (window.innerWidth > 768) return;
    if (!overlay.classList.contains("show")) return;
    if (e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    currentY = startY;
    dragging = true;
    sheet.style.transition = "none";
  }, { passive: true });

  hero.addEventListener("touchmove", function (e) {
    if (!dragging) return;
    currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - startY);
    sheet.style.transform = "translateY(" + delta + "px)";
  }, { passive: true });

  hero.addEventListener("touchend", function () {
    if (!dragging) return;
    dragging = false;
    const delta = currentY - startY;
    sheet.style.transition = "";

    if (delta > 120) {
      window.CourseModal.close();
    }
    sheet.style.transform = "";
  });
})();

/* ============================================================
   MOBILE MODAL — VIEWPORT HEIGHT SYNC
   ------------------------------------------------------------
   Independent of the swipe handler. Uses visualViewport to
   size the sheet precisely, including when the mobile URL bar
   hides/shows during scroll.

   Runs for everyone, including users with reduced motion.
   ============================================================ */
(function syncModalViewport() {
  function getVisibleHeight() {
    return window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
  }

  let ticking = false;

  function applyNow() {
    ticking = false;
    const sheet = document.querySelector(".course-modal");
    if (!sheet) return;

    if (window.innerWidth > 768) {
      // Desktop — clear any inline overrides
      sheet.style.top = "";
      sheet.style.bottom = "";
      return;
    }

    // Mobile — top = 8% of the *visible* height
    const visible = getVisibleHeight();
    const topPx = Math.round(visible * 0.08);
    sheet.style.top = topPx + "px";
    sheet.style.bottom = "0";
  }

  function apply() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(applyNow);
  }

  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", function () {
    setTimeout(apply, 250);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", apply);
    window.visualViewport.addEventListener("scroll", apply);
  }

  // Re-apply every time the modal is opened
  const originalOpen = window.CourseModal.open;
  window.CourseModal.open = function (id) {
    originalOpen(id);
    window.requestAnimationFrame(applyNow);
  };
})();
