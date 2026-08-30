import { hash } from "bcryptjs";
import User, { IUser } from "../models/User";
import Course, { ICourse } from "../models/Course";
import Section from "../models/Section";
import Lesson from "../models/Lesson";
import LessonItem from "../models/LessonItem";
import Quiz from "../models/Quiz";
import CourseFAQ from "../models/CourseFAQ";
import Announcement from "../models/Announcement";
import Assignment from "../models/Assignment";
import { syncEnrollmentLessonCount } from "../controllers/course/shared";

export interface InstructorSeedInput {
  name: string;
  email: string;
  password?: string;
  headline?: string;
  bio?: string;
  avatar?: string;
  interests?: string[];
}

export interface GeneratorOptions {
  instructor: InstructorSeedInput;
  selectedPresets?: string[];
  courseOverrides?: {
    isPublished?: boolean;
    isPaid?: boolean;
  };
  forceRegenerate?: boolean;
}

export interface PresetCourseDefinition {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  tags: string[];
  level: "beginner" | "intermediate" | "advanced";
  isPaid: boolean;
  price: number | null;
  whatYouWillLearn: string[];
  prerequisites: string[];
  sections: {
    title: string;
    order: number;
    lessons: {
      title: string;
      order: number;
      type: "video" | "article" | "quiz" | "assignment";
      durationMinutes: number;
      isPreview: boolean;
      isMandatory: boolean;
      items: {
        type: "video" | "text" | "link" | "pdf";
        order: number;
        content: {
          url?: string;
          text?: string;
        };
      }[];
      quiz?: {
        passingPercentage: number;
        questions: {
          question: string;
          options: string[];
          correctAnswer: number;
        }[];
      };
      assignment?: {
        description: string;
        instructions: string;
        maxScore: number;
        rubric: { criterion: string; maxPoints: number }[];
      };
    }[];
  }[];
  faqs: { question: string; answer: string; order: number }[];
  announcements: { title: string; body: string }[];
}

export const PRESET_COURSES: PresetCourseDefinition[] = [
  {
    id: "web-dev",
    title: "Modern Full-Stack Web Development (React, Node.js & TypeScript)",
    description: "Master modern full-stack web development from scratch. Build production-ready, scalable applications using React 19, Node.js, Express, TypeScript, and MongoDB with industry best practices.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1000&auto=format&fit=crop",
    tags: ["React", "Node.js", "TypeScript", "Fullstack", "Web Development", "MongoDB"],
    level: "beginner",
    isPaid: false,
    price: null,
    whatYouWillLearn: [
      "Master TypeScript fundamentals and type-safe backend & frontend architectures",
      "Build dynamic user interfaces with React 19, Custom Hooks, and Tailwind CSS",
      "Develop secure RESTful APIs using Express.js and MongoDB Mongoose models",
      "Implement JWT authentication, role-based access control, and file uploads",
      "Deploy scalable full-stack applications with production-grade monitoring"
    ],
    prerequisites: [
      "Basic understanding of HTML, CSS, and basic JavaScript",
      "A computer with Node.js 18+ and VS Code installed"
    ],
    sections: [
      {
        title: "Foundations of Modern Web Architecture & TypeScript",
        order: 1,
        lessons: [
          {
            title: "Course Overview & Full-Stack Architecture",
            order: 1,
            type: "video",
            durationMinutes: 14,
            isPreview: true,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=kUMe1FH4CHE"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Welcome to Modern Full-Stack Web Development! 🎉\n\nIn this lesson, we break down the high-level architecture of modern single-page applications (SPAs) connecting to RESTful and GraphQL backend microservices.\n\n### Key Concepts Covered:\n- Client-Server Architecture & Request-Response Lifecycle\n- Stateless HTTP and JSON payload serialization\n- Separation of concerns between UI presentation and data persistence\n- Monolithic vs Decoupled Full-Stack Architecture`
                }
              }
            ]
          },
          {
            title: "TypeScript Deep-Dive & Type System Essentials",
            order: 2,
            type: "article",
            durationMinutes: 20,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# TypeScript Essentials for Full-Stack Developers\n\nTypeScript provides compile-time safety and self-documenting APIs across both frontend and backend layers.\n\n\`\`\`typescript\n// Example: Type-Safe User Interface & Generic ApiResponse\nexport interface User {\n  id: string;\n  email: string;\n  name: string;\n  role: 'student' | 'instructor' | 'admin';\n  createdAt: Date;\n}\n\nexport interface ApiResponse<T> {\n  success: boolean;\n  data: T;\n  message?: string;\n}\n\nexport function formatGreeting(user: User): string {\n  return \`Welcome back, \${user.name} (\${user.role.toUpperCase()})\`;\n}\n\`\`\`\n\n### Why TypeScript in Modern Teams?\n1. **Elimination of runtime type errors** before code reaches production.\n2. **Enhanced developer experience** with instant IntelliSense and refactoring tools.\n3. **Shared type contracts** between backend schemas and frontend client state.`
                }
              },
              {
                type: "link",
                order: 2,
                content: {
                  url: "https://www.typescriptlang.org/docs/handbook/intro.html"
                }
              }
            ]
          },
          {
            title: "Quiz: TypeScript & Web Architecture Fundamentals",
            order: 3,
            type: "quiz",
            durationMinutes: 10,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 70,
              questions: [
                {
                  question: "What is the primary benefit of TypeScript over plain JavaScript?",
                  options: [
                    "TypeScript executes faster in the browser without compilation",
                    "Compile-time type checking and early error detection",
                    "TypeScript replaces the need for a backend database",
                    "TypeScript automatically writes all unit tests"
                  ],
                  correctAnswer: 1
                },
                {
                  question: "Which HTTP method is idempotent and used to replace an existing resource completely?",
                  options: ["POST", "PATCH", "PUT", "DELETE"],
                  correctAnswer: 2
                },
                {
                  question: "In a stateless REST API, where should authentication tokens like JWT usually be sent?",
                  options: [
                    "In the Authorization header as a Bearer token",
                    "Hardcoded in the query string parameters of every URL",
                    "In the HTML meta tags",
                    "In the DNS TXT record"
                  ],
                  correctAnswer: 0
                }
              ]
            }
          }
        ]
      },
      {
        title: "Reactive Frontend Engineering with React 19 & Tailwind",
        order: 2,
        lessons: [
          {
            title: "React Components, State & Hooks Masterclass",
            order: 1,
            type: "video",
            durationMinutes: 28,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=SqcY0GlETPk"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `### React Hooks Architecture\n\nReact's declarative component model uses hooks for side effects, caching, and state synchronization:\n\n- \`useState\`: Local component state\n- \`useEffect\`: Lifecycle synchronizations with external systems\n- \`useCallback\` & \`useMemo\`: Referential identity and performance memoization\n- \`useContext\`: Global dependency injection across component subtrees`
                }
              }
            ]
          },
          {
            title: "State Management Patterns & Custom Hooks",
            order: 2,
            type: "article",
            durationMinutes: 22,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Advanced React State Patterns\n\n\`\`\`tsx\nimport { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number = 300): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const timer = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n\n  return debouncedValue;\n}\n\`\`\`\n\n### Core Best Practices:\n1. Keep component state localized to where it is needed.\n2. Lift state up only when multiple siblings need synchronized data.\n3. Encapsulate complex side-effects into reusable custom hooks.`
                }
              }
            ]
          },
          {
            title: "Hands-on Project: Interactive Task Management Dashboard",
            order: 3,
            type: "assignment",
            durationMinutes: 45,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Project Brief: Task Management Dashboard\n\nBuild an interactive task tracker with the following features:\n1. Filter tasks by category and completion status.\n2. Support inline task editing and smooth state toggling.\n3. Persist tasks to localStorage or a mock API.\n\nSubmit your GitHub repository link or live demo URL below.`
                }
              }
            ],
            assignment: {
              description: "Build and submit an interactive React task management dashboard.",
              instructions: "Please submit your GitHub repository link and a deployed demo URL.",
              maxScore: 100,
              rubric: [
                { criterion: "Clean component hierarchy and modular design", maxPoints: 30 },
                { criterion: "Proper TypeScript types and state management", maxPoints: 35 },
                { criterion: "Responsive Tailwind CSS UI styling and error handling", maxPoints: 35 }
              ]
            }
          }
        ]
      },
      {
        title: "Backend RESTful APIs with Node.js, Express & MongoDB",
        order: 3,
        lessons: [
          {
            title: "Building Robust RESTful APIs with Express & Middleware",
            order: 1,
            type: "video",
            durationMinutes: 32,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=-MTSQjw5DrM"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Express.js Routing & Middleware Pipeline\n\nMiddleware functions have access to the request object (\`req\`), response object (\`res\`), and next middleware function (\`next\`).\n\n\`\`\`typescript\nimport express, { Request, Response, NextFunction } from 'express';\n\nexport function authGuard(req: Request, res: Response, next: NextFunction) {\n  const token = req.headers.authorization?.split(' ')[1];\n  if (!token) {\n    return res.status(401).json({ message: 'Authentication required' });\n  }\n  // Verify JWT token\n  next();\n}\n\`\`\``
                }
              }
            ]
          },
          {
            title: "Database Modeling with Mongoose & Security Hardening",
            order: 2,
            type: "article",
            durationMinutes: 25,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# MongoDB Schema Design & Query Optimization\n\n- Use compound indexes for frequently paired query filters.\n- Implement schema pre-save hooks for password hashing and normalization.\n- Prevent NoSQL injection by validating request bodies with Zod schemas.`
                }
              }
            ]
          },
          {
            title: "Full-Stack Web Dev Certification Quiz",
            order: 3,
            type: "quiz",
            durationMinutes: 15,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 75,
              questions: [
                {
                  question: "What does the `next()` function do in Express.js middleware?",
                  options: [
                    "Passes control to the next middleware function in the stack",
                    "Sends an HTTP 200 response immediately",
                    "Restarts the Node.js process",
                    "Closes the MongoDB connection"
                  ],
                  correctAnswer: 0
                },
                {
                  question: "Which MongoDB method creates an efficient index for text search queries across multiple fields?",
                  options: ["schema.index({ field1: 'text', field2: 'text' })", "schema.createFullScan()", "schema.useRegex()", "schema.autoFilter()"],
                  correctAnswer: 0
                }
              ]
            }
          }
        ]
      }
    ],
    faqs: [
      {
        question: "Is this course beginner-friendly?",
        answer: "Yes! While having basic HTML/CSS and JavaScript fundamentals helps, we explain every concept from ground up with code walkthroughs.",
        order: 1
      },
      {
        question: "Do I get a certificate upon completion?",
        answer: "Yes! Completing all lessons, quizzes, and projects automatically generates a verified digital Certificate of Completion with a shareable verification link.",
        order: 2
      }
    ],
    announcements: [
      {
        title: "Welcome to the Official SkillKart Web Development Track!",
        body: "Welcome everyone! Feel free to ask questions in the lesson discussions tab whenever you need guidance or code reviews."
      }
    ]
  },
  {
    id: "python-ai",
    title: "Python for Data Science, Machine Learning & Generative AI",
    description: "Learn practical Python programming for data analytics, scientific computing, predictive machine learning models, and modern Large Language Model (LLM) workflows with NumPy, Pandas, Scikit-Learn, and PyTorch.",
    thumbnailUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop",
    tags: ["Python", "Machine Learning", "Data Science", "AI", "PyTorch", "LLM"],
    level: "intermediate",
    isPaid: true,
    price: 49.99,
    whatYouWillLearn: [
      "Master Python data structures, list comprehensions, and functional programming",
      "Perform high-speed vectorized data analysis with Pandas and NumPy",
      "Train classification and regression models with Scikit-Learn",
      "Build neural networks with PyTorch and understand attention mechanisms",
      "Integrate OpenAI and open-source HuggingFace models into applications"
    ],
    prerequisites: [
      "Basic programming experience in any language",
      "Familiarity with basic high-school math (algebra and matrices)"
    ],
    sections: [
      {
        title: "Python Foundations & Scientific Computing Setup",
        order: 1,
        lessons: [
          {
            title: "Python for Data Science & Jupyter Environment Setup",
            order: 1,
            type: "video",
            durationMinutes: 22,
            isPreview: true,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=rfscVS0vtbw"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Introduction to Scientific Computing with Python\n\nPython is the industry-standard lingua franca of artificial intelligence and machine learning due to its rich ecosystem of C-accelerated libraries.\n\n### Key Libraries in Our Stack:\n- **NumPy**: N-dimensional array processing\n- **Pandas**: Tabular data frames and time series transformation\n- **Matplotlib & Seaborn**: Statistical data visualization\n- **Scikit-Learn**: Classical ML algorithms`
                }
              }
            ]
          },
          {
            title: "Data Structures, List Comprehensions & Vectorization",
            order: 2,
            type: "article",
            durationMinutes: 20,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Vectorized NumPy Operations\n\n\`\`\`python\nimport numpy as np\n\n# Vectorized matrix dot-product vs slow Python loops\na = np.random.rand(1000, 1000)\nb = np.random.rand(1000, 1000)\n\n# 100x faster than pure Python nested iteration\nc = np.dot(a, b)\nprint(f"Result shape: {c.shape}")\n\`\`\``
                }
              }
            ]
          },
          {
            title: "Quiz: Python Data Science Essentials",
            order: 3,
            type: "quiz",
            durationMinutes: 12,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 75,
              questions: [
                {
                  question: "What is the primary advantage of NumPy arrays over standard Python lists?",
                  options: [
                    "They allow mixed data types in the same array",
                    "Contiguous memory allocation and vectorized SIMD operations",
                    "They don't use memory at all",
                    "They automatically plot graphs"
                  ],
                  correctAnswer: 1
                },
                {
                  question: "Which Pandas method is used to display summary statistical metrics of numeric columns?",
                  options: ["df.info()", "df.describe()", "df.summary()", "df.stats()"],
                  correctAnswer: 1
                }
              ]
            }
          }
        ]
      },
      {
        title: "Data Wrangling & Statistical Analysis with Pandas",
        order: 2,
        lessons: [
          {
            title: "Data Wrangling, Cleaning & Feature Engineering",
            order: 1,
            type: "video",
            durationMinutes: 26,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=vmEHCJofslg"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Practical Data Cleaning & Feature Engineering\n\n\`\`\`python\nimport pandas as pd\nfrom sklearn.preprocessing import StandardScaler\n\ndf = pd.read_csv('dataset.csv')\ndf['price'].fillna(df['price'].median(), inplace=True)\n\nscaler = StandardScaler()\nscaled_data = scaler.fit_transform(df[['price', 'bedrooms']])\n\`\`\``
                }
              }
            ]
          },
          {
            title: "Hands-on Project: Real-Estate Price Prediction Model",
            order: 2,
            type: "assignment",
            durationMinutes: 50,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Project: Predictive Pricing Model\n\nTrain and evaluate a regression model predicting housing prices based on features like square footage, location, and year built. Report your R2 score and RMSE.`
                }
              }
            ],
            assignment: {
              description: "Build, evaluate and submit a Jupyter notebook predicting housing prices.",
              instructions: "Upload your notebook or provide a Google Colab link.",
              maxScore: 100,
              rubric: [
                { criterion: "Comprehensive exploratory data analysis and outlier handling", maxPoints: 35 },
                { criterion: "Proper train/test split and cross-validation", maxPoints: 35 },
                { criterion: "Model evaluation with metrics and residual plots", maxPoints: 30 }
              ]
            }
          }
        ]
      },
      {
        title: "Predictive Machine Learning with Scikit-Learn & PyTorch",
        order: 3,
        lessons: [
          {
            title: "Supervised & Unsupervised Machine Learning Algorithms",
            order: 1,
            type: "video",
            durationMinutes: 30,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=i_LwzRVP7bg"
                }
              }
            ]
          },
          {
            title: "Machine Learning Certification Quiz",
            order: 2,
            type: "quiz",
            durationMinutes: 15,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 70,
              questions: [
                {
                  question: "What problem occurs when a machine learning model memorizes training data including noise?",
                  options: ["Underfitting", "Overfitting", "Data Drift", "Vanishing Gradient"],
                  correctAnswer: 1
                },
                {
                  question: "Which metric is best suited for evaluating an imbalanced classification problem?",
                  options: ["Accuracy", "F1-Score / PR-AUC", "Mean Squared Error", "R-Squared"],
                  correctAnswer: 1
                }
              ]
            }
          }
        ]
      }
    ],
    faqs: [
      {
        question: "Do I need a GPU to run the course code?",
        answer: "No! Most exercises run seamlessly on standard CPU machines or via free Google Colab cloud notebooks.",
        order: 1
      }
    ],
    announcements: [
      {
        title: "Course Launched: Python AI & Machine Learning",
        body: "We are thrilled to launch this comprehensive course covering foundational AI and modern LLM application workflows."
      }
    ]
  },
  {
    id: "cloud-devops",
    title: "Cloud Architecture, Docker & Kubernetes DevOps Masterclass",
    description: "Learn to build resilient cloud architectures, containerize microservices with Docker, automate CI/CD pipelines, and orchestrate enterprise clusters with Kubernetes and Terraform on AWS.",
    thumbnailUrl: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?q=80&w=1000&auto=format&fit=crop",
    tags: ["DevOps", "Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Cloud"],
    level: "intermediate",
    isPaid: true,
    price: 59.99,
    whatYouWillLearn: [
      "Containerize multi-tier web applications using multi-stage Dockerfiles",
      "Deploy and manage production Kubernetes pods, services, ingress, and deployments",
      "Build automated GitHub Actions CI/CD pipelines with testing and container registry pushes",
      "Provision reproducible cloud infrastructure using Infrastructure as Code (IaC) with Terraform",
      "Implement zero-downtime rolling updates and observability with Prometheus & Grafana"
    ],
    prerequisites: [
      "Basic Linux terminal navigation & command-line comfort",
      "Basic understanding of web servers and network protocols"
    ],
    sections: [
      {
        title: "Microservices Containerization with Docker",
        order: 1,
        lessons: [
          {
            title: "Docker Essentials: Images, Containers & Multi-Stage Builds",
            order: 1,
            type: "video",
            durationMinutes: 24,
            isPreview: true,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=fqMOX6JJhGo"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Dockerfile Optimization & Multi-Stage Builds\n\nMulti-stage Docker builds separate build dependencies from the lean production runtime image, minimizing vulnerabilities and image sizes.\n\n\`\`\`dockerfile\n# Stage 1: Build stage\nFROM node:20-alpine AS builder\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\n# Stage 2: Production runner\nFROM node:20-alpine AS runner\nWORKDIR /app\nENV NODE_ENV=production\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY --from=builder /app/dist ./dist\n\nUSER node\nEXPOSE 3000\nCMD ["node", "dist/server.js"]\n\`\`\``
                }
              }
            ]
          },
          {
            title: "Quiz: Docker & Containerization Best Practices",
            order: 2,
            type: "quiz",
            durationMinutes: 10,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 70,
              questions: [
                {
                  question: "What is the primary benefit of multi-stage Docker builds?",
                  options: [
                    "They make the Docker build command run concurrently on multiple hosts",
                    "They dramatically reduce the final production image size and attack surface",
                    "They convert containers into virtual machines",
                    "They allow Docker to run without a daemon"
                  ],
                  correctAnswer: 1
                },
                {
                  question: "Which Docker command removes all stopped containers, unused networks, and dangling images?",
                  options: ["docker system prune", "docker clean --all", "docker reset", "docker kill"],
                  correctAnswer: 0
                }
              ]
            }
          }
        ]
      },
      {
        title: "Kubernetes Cluster Orchestration & Deployment",
        order: 2,
        lessons: [
          {
            title: "Kubernetes Architecture: Pods, Services & Ingress",
            order: 1,
            type: "video",
            durationMinutes: 32,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=X48VuDVv0do"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Kubernetes Core Workloads\n\n- **Pod**: Smallest deployable unit containing one or more containers\n- **Deployment**: Declarative controller managing pod replicas and rolling zero-downtime updates\n- **Service**: Stable network endpoint and internal load balancer\n- **Ingress**: External HTTP/HTTPS routing into cluster services`
                }
              }
            ]
          },
          {
            title: "Hands-on Project: Deploying a Multi-Tier Microservice on Kubernetes",
            order: 2,
            type: "assignment",
            durationMinutes: 60,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Project Brief: Kubernetes Microservices Deployment\n\nWrite YAML manifests (Deployment, Service, ConfigMap, Ingress) for a frontend and backend microservices architecture with liveness and readiness probes.`
                }
              }
            ],
            assignment: {
              description: "Deploy and submit complete Kubernetes YAML manifests.",
              instructions: "Submit your GitHub repository containing the k8s manifest files.",
              maxScore: 100,
              rubric: [
                { criterion: "Proper resource limits and requests specified", maxPoints: 30 },
                { criterion: "Configured liveness and readiness probes", maxPoints: 35 },
                { criterion: "Service and Ingress routing definitions", maxPoints: 35 }
              ]
            }
          }
        ]
      },
      {
        title: "CI/CD Automation with GitHub Actions & AWS Cloud",
        order: 3,
        lessons: [
          {
            title: "Automating Deployments with GitHub Actions CI/CD",
            order: 1,
            type: "video",
            durationMinutes: 28,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=R8_veQiYBjI"
                }
              }
            ]
          },
          {
            title: "Cloud DevOps Certification Exam",
            order: 2,
            type: "quiz",
            durationMinutes: 15,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 75,
              questions: [
                {
                  question: "Which Kubernetes resource guarantees that a specific number of pod replicas are running at any time?",
                  options: ["Deployment / ReplicaSet", "ConfigMap", "Ingress", "Namespace"],
                  correctAnswer: 0
                },
                {
                  question: "What is Infrastructure as Code (IaC)?",
                  options: [
                    "Managing and provisioning computing infrastructure through machine-readable definition files",
                    "Manually clicking buttons in the AWS management console",
                    "Writing CSS code to style server racks",
                    "Compiling C++ code into machine code"
                  ],
                  correctAnswer: 0
                }
              ]
            }
          }
        ]
      }
    ],
    faqs: [
      {
        question: "Can I follow along with a free AWS account?",
        answer: "Yes! All cloud deployments in this course are designed to fit within the free tier limits.",
        order: 1
      }
    ],
    announcements: [
      {
        title: "Welcome to Cloud & DevOps Masterclass",
        body: "Get ready to master production container deployments and Kubernetes cluster management!"
      }
    ]
  },
  {
    id: "ui-ux",
    title: "Mastering UI/UX Design & Design Systems with Figma",
    description: "Design intuitive, delightful user interfaces and high-converting experiences. Master Figma auto-layout, interactive prototypes, design tokens, typography, and scalable design systems.",
    thumbnailUrl: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1000&auto=format&fit=crop",
    tags: ["UI/UX", "Figma", "Design Systems", "Prototyping", "Product Design"],
    level: "beginner",
    isPaid: true,
    price: 29.99,
    whatYouWillLearn: [
      "Master Figma Auto-Layout 5.0, Components, and Component Properties",
      "Apply visual hierarchy, typography scales, contrast ratios, and whitespace rules",
      "Build cohesive design token systems for dark and light modes",
      "Create interactive prototypes with animated micro-interactions",
      "Prepare developer handoffs with annotated specs and asset exports"
    ],
    prerequisites: [
      "No prior design experience needed",
      "A free Figma account"
    ],
    sections: [
      {
        title: "Design Principles, Visual Hierarchy & Typography",
        order: 1,
        lessons: [
          {
            title: "Introduction to Modern UI/UX Design Principles",
            order: 1,
            type: "video",
            durationMinutes: 18,
            isPreview: true,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=c9Wg6Cb_YlU"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Visual Hierarchy in Digital Products\n\nVisual hierarchy guides the user's eye across the page in order of importance through:\n1. **Scale**: Larger elements command immediate attention.\n2. **Contrast & Color**: High contrast draws focus to call-to-action buttons.\n3. **Whitespace**: Generous breathing room groups related elements together.`
                }
              }
            ]
          },
          {
            title: "Quiz: UI/UX Design Foundations",
            order: 2,
            type: "quiz",
            durationMinutes: 10,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 70,
              questions: [
                {
                  question: "What is the 8pt spacing grid system primarily used for?",
                  options: [
                    "Ensuring consistent visual rhythm and effortless developer implementation",
                    "Limiting websites to only 8 colors",
                    "Formatting text to 8 words per sentence",
                    "Resizing browser windows"
                  ],
                  correctAnswer: 0
                }
              ]
            }
          }
        ]
      },
      {
        title: "Figma Masterclass: Auto-Layout & Design Tokens",
        order: 2,
        lessons: [
          {
            title: "Figma Auto-Layout & Component Systems",
            order: 1,
            type: "video",
            durationMinutes: 24,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=FTFaQWZBqQ8"
                }
              }
            ]
          },
          {
            title: "Design Challenge: High-Fidelity Mobile App Prototype",
            order: 2,
            type: "assignment",
            durationMinutes: 45,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Design Challenge Brief\n\nCreate a 3-screen mobile banking or e-commerce flow using Figma Auto-Layout and Component variants.`
                }
              }
            ],
            assignment: {
              description: "Submit a shareable Figma prototype link.",
              instructions: "Ensure view permissions are enabled on the Figma link.",
              maxScore: 100,
              rubric: [
                { criterion: "Clean Figma layer naming and component organization", maxPoints: 40 },
                { criterion: "Consistent typography and color tokens", maxPoints: 30 },
                { criterion: "Interactive prototype connections", maxPoints: 30 }
              ]
            }
          }
        ]
      }
    ],
    faqs: [
      {
        question: "Is Figma free to use for this course?",
        answer: "Yes, all course exercises use the free tier of Figma without requiring any paid subscriptions.",
        order: 1
      }
    ],
    announcements: [
      {
        title: "Welcome to UI/UX Design with Figma",
        body: "We will be building complete design systems and wireframes step-by-step."
      }
    ]
  },
  {
    id: "nextjs-fullstack",
    title: "Next.js 15 Fullstack Architecture & Server Actions",
    description: "Learn Next.js 15 App Router from fundamentals to enterprise architectures. Master React Server Components (RSC), Server Actions, Streaming SSR, caching strategies, and edge deployment.",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop",
    tags: ["Next.js", "React", "Server Actions", "Fullstack", "Web Development", "TypeScript"],
    level: "advanced",
    isPaid: true,
    price: 39.99,
    whatYouWillLearn: [
      "Master Next.js 15 App Router and React Server Components (RSC)",
      "Build mutation workflows with Type-Safe Server Actions and optimistic updates",
      "Implement advanced nested layouts, parallel routes, and intercepting routes",
      "Optimize core web vitals, image pipelines, and edge caching policies",
      "Deploy with Vercel or self-hosted Docker environments"
    ],
    prerequisites: [
      "Solid understanding of React and JavaScript / TypeScript",
      "Basic understanding of async programming and HTTP APIs"
    ],
    sections: [
      {
        title: "App Router & Server Component Paradigms",
        order: 1,
        lessons: [
          {
            title: "React Server Components & Next.js 15 Architecture",
            order: 1,
            type: "video",
            durationMinutes: 20,
            isPreview: true,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=843nec-IvW0"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Understanding React Server Components (RSC)\n\nReact Server Components render exclusively on the server, sending pre-rendered HTML and JSON serializations to the client without shipping large JavaScript bundle weight.\n\n\`\`\`typescript\n// app/dashboard/page.tsx - Server Component\nimport { Suspense } from 'react';\nimport AnalyticsCard from '@/components/AnalyticsCard';\n\nexport default async function DashboardPage() {\n  const stats = await getPlatformStats();\n\n  return (\n    <div className="p-8 space-y-6">\n      <h1 className="text-2xl font-bold">Platform Overview</h1>\n      <Suspense fallback={<div>Loading real-time metrics...</div>}>\n        <AnalyticsCard data={stats} />\n      </Suspense>\n    </div>\n  );\n}\n\`\`\``
                }
              }
            ]
          },
          {
            title: "Quiz: App Router & Server Components",
            order: 2,
            type: "quiz",
            durationMinutes: 10,
            isPreview: false,
            isMandatory: true,
            items: [],
            quiz: {
              passingPercentage: 70,
              questions: [
                {
                  question: "Where do React Server Components (RSC) execute by default in the Next.js App Router?",
                  options: [
                    "Exclusively on the server",
                    "In the user's browser client",
                    "Inside a web worker thread",
                    "Inside localStorage"
                  ],
                  correctAnswer: 0
                }
              ]
            }
          }
        ]
      },
      {
        title: "Type-Safe Mutations with Server Actions & Caching",
        order: 2,
        lessons: [
          {
            title: "Full-Stack Server Actions & Form Mutations",
            order: 1,
            type: "video",
            durationMinutes: 26,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "video",
                order: 1,
                content: {
                  url: "https://www.youtube.com/watch?v=d5x0JCb2eG0"
                }
              },
              {
                type: "text",
                order: 2,
                content: {
                  text: `# Server Actions in Next.js\n\n\`\`\`typescript\n'use server';\nimport { revalidatePath } from 'next/cache';\n\nexport async function updateProfile(formData: FormData) {\n  const name = formData.get('name') as string;\n  await db.user.update({ where: { id: userId }, data: { name } });\n  revalidatePath('/profile');\n}\n\`\`\``
                }
              }
            ]
          },
          {
            title: "Hands-on Project: Fullstack Storefront with Server Actions",
            order: 2,
            type: "assignment",
            durationMinutes: 50,
            isPreview: false,
            isMandatory: true,
            items: [
              {
                type: "text",
                order: 1,
                content: {
                  text: `# Project Brief: Next.js Fullstack Storefront\n\nBuild a storefront featuring Server Actions for cart updates and review submissions with optimistic UI updates.`
                }
              }
            ],
            assignment: {
              description: "Build and submit a Next.js 15 application with Server Actions.",
              instructions: "Submit your GitHub repository link and Vercel live URL.",
              maxScore: 100,
              rubric: [
                { criterion: "Use of React Server Components and Server Actions", maxPoints: 40 },
                { criterion: "Data caching and path revalidation strategy", maxPoints: 30 },
                { criterion: "Optimistic UI state updates", maxPoints: 30 }
              ]
            }
          }
        ]
      }
    ],
    faqs: [
      {
        question: "Is this updated for Next.js 15?",
        answer: "Yes, all lessons are updated with Next.js 15 conventions, async request handling, and Server Actions.",
        order: 1
      }
    ],
    announcements: [
      {
        title: "Next.js 15 Track Available Now",
        body: "Learn the cutting-edge patterns of modern React Server Components and Server Actions."
      }
    ]
  }
];

export const DEFAULT_SKILLKART_INSTRUCTOR: InstructorSeedInput = {
  name: "Skillkart",
  email: "official@skillkart.com",
  password: "Password@123",
  headline: "Official SkillKart Platform & Masterclass Academy",
  bio: "Official verified courses and high-impact technology masterclasses curated directly by the SkillKart platform engineering and instruction team.",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
  interests: ["Web Development", "Artificial Intelligence", "DevOps", "Cloud", "UI/UX Design"]
};

export async function getOrCreateInstructor(input: InstructorSeedInput): Promise<{ instructor: IUser; created: boolean }> {
  const normalizedEmail = input.email.toLowerCase().trim();
  let instructor = await User.findOne({ email: normalizedEmail });

  if (instructor) {
    let modified = false;
    if (instructor.role === "student") {
      instructor.role = "instructor";
      modified = true;
    }
    if (!instructor.onboardingCompleted) {
      instructor.onboardingCompleted = true;
      modified = true;
    }
    if (!instructor.headline && input.headline) {
      instructor.headline = input.headline;
      modified = true;
    }
    if (!instructor.bio && input.bio) {
      instructor.bio = input.bio;
      modified = true;
    }
    if (modified) {
      await instructor.save();
    }
    return { instructor, created: false };
  }

  const hashedPassword = await hash(input.password || "Password@123", 10);
  instructor = await User.create({
    name: input.name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "instructor",
    onboardingCompleted: true,
    headline: input.headline || `${input.name} - Official Instructor`,
    bio: input.bio || `Instructor on SkillKart specializing in practical technology education.`,
    avatar: input.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop",
    interests: input.interests || ["Technology", "Software Development"],
    isActive: true,
  });

  return { instructor, created: true };
}

export interface GenerationResult {
  instructor: {
    id: string;
    name: string;
    email: string;
    created: boolean;
  };
  coursesCreated: number;
  coursesSkipped: number;
  totalSectionsCreated: number;
  totalLessonsCreated: number;
  totalQuizzesCreated: number;
  details: {
    courseId: string;
    title: string;
    status: "created" | "already_exists";
    sectionsCount: number;
    lessonsCount: number;
  }[];
}

export async function generateInstructorAndCourses(options: GeneratorOptions): Promise<GenerationResult> {
  const { instructor, created: instructorCreated } = await getOrCreateInstructor(options.instructor);

  const selectedPresetIds = options.selectedPresets && options.selectedPresets.length > 0
    ? options.selectedPresets
    : PRESET_COURSES.map((p) => p.id);

  const presetsToGenerate = PRESET_COURSES.filter((p) => selectedPresetIds.includes(p.id));

  const result: GenerationResult = {
    instructor: {
      id: instructor._id.toString(),
      name: instructor.name,
      email: instructor.email,
      created: instructorCreated,
    },
    coursesCreated: 0,
    coursesSkipped: 0,
    totalSectionsCreated: 0,
    totalLessonsCreated: 0,
    totalQuizzesCreated: 0,
    details: [],
  };

  for (const preset of presetsToGenerate) {
    const existingCourse = await Course.findOne({
      instructor: instructor._id,
      title: preset.title,
    });

    if (existingCourse && !options.forceRegenerate) {
      result.coursesSkipped++;
      result.details.push({
        courseId: existingCourse._id.toString(),
        title: existingCourse.title,
        status: "already_exists",
        sectionsCount: await Section.countDocuments({ course: existingCourse._id }),
        lessonsCount: await Lesson.countDocuments({ section: { $in: await Section.find({ course: existingCourse._id }).distinct("_id") } }),
      });
      continue;
    }

    // Determine course pricing / publish status
    const isPaid = options.courseOverrides?.isPaid !== undefined ? options.courseOverrides.isPaid : preset.isPaid;
    const price = isPaid ? (preset.price || 29.99) : null;
    const isPublished = options.courseOverrides?.isPublished !== undefined ? options.courseOverrides.isPublished : true;

    let course: ICourse;

    if (existingCourse && options.forceRegenerate) {
      // Clean up previous child data to do a fresh replacement
      const oldSections = await Section.find({ course: existingCourse._id }).select("_id").lean();
      const oldSectionIds = oldSections.map((s) => s._id);
      const oldLessons = await Lesson.find({ section: { $in: oldSectionIds } }).select("_id").lean();
      const oldLessonIds = oldLessons.map((l) => l._id);

      await LessonItem.deleteMany({ lesson: { $in: oldLessonIds } });
      await Quiz.deleteMany({ lesson: { $in: oldLessonIds } });
      await Assignment.deleteMany({ course: existingCourse._id });
      await CourseFAQ.deleteMany({ course: existingCourse._id });
      await Announcement.deleteMany({ course: existingCourse._id });
      await Lesson.deleteMany({ _id: { $in: oldLessonIds } });
      await Section.deleteMany({ _id: { $in: oldSectionIds } });

      existingCourse.description = preset.description;
      existingCourse.thumbnailUrl = preset.thumbnailUrl;
      existingCourse.tags = preset.tags;
      existingCourse.level = preset.level;
      existingCourse.isPaid = isPaid;
      existingCourse.price = price;
      existingCourse.whatYouWillLearn = preset.whatYouWillLearn;
      existingCourse.prerequisites = preset.prerequisites;
      existingCourse.status = isPublished ? "published" : "draft";
      await existingCourse.save();

      course = existingCourse;
    } else {
      // Create new course
      course = await Course.create({
        title: preset.title,
        description: preset.description,
        thumbnailUrl: preset.thumbnailUrl,
        tags: preset.tags,
        level: preset.level,
        isPaid,
        price,
        status: isPublished ? "published" : "draft",
        publishedAt: isPublished ? new Date() : undefined,
        instructor: instructor._id,
        whatYouWillLearn: preset.whatYouWillLearn,
        prerequisites: preset.prerequisites,
        isActive: true,
        isApproved: true,
      });
    }

    let courseLessonsCount = 0;

    // Create sections & lessons
    for (const secDef of preset.sections) {
      const cleanTitle = secDef.title.replace(/^Section\s*\d+\s*:\s*/i, "");
      const section = await Section.create({
        course: course._id,
        title: cleanTitle,
        order: secDef.order,
        isLocked: false,
      });
      result.totalSectionsCreated++;

      for (const lesDef of secDef.lessons) {
        const lesson = await Lesson.create({
          section: section._id,
          title: lesDef.title,
          type: lesDef.type,
          order: lesDef.order,
          durationMinutes: lesDef.durationMinutes,
          isPreview: lesDef.isPreview,
          isMandatory: lesDef.isMandatory,
        });
        result.totalLessonsCreated++;
        courseLessonsCount++;

        // Create lesson items (video / text docs / links)
        for (const itemDef of lesDef.items) {
          await LessonItem.create({
            lesson: lesson._id,
            type: itemDef.type,
            content: itemDef.content,
            order: itemDef.order,
          });
        }

        // Create quiz if defined
        if (lesDef.quiz && lesDef.quiz.questions.length > 0) {
          await Quiz.create({
            lesson: lesson._id,
            questions: lesDef.quiz.questions,
            passingPercentage: lesDef.quiz.passingPercentage,
          });
          result.totalQuizzesCreated++;
        }

        // Create assignment if defined
        if (lesDef.assignment) {
          await Assignment.create({
            course: course._id,
            section: section._id,
            title: `Assignment: ${lesDef.title}`,
            description: lesDef.assignment.description,
            instructions: lesDef.assignment.instructions,
            rubric: lesDef.assignment.rubric,
            maxScore: lesDef.assignment.maxScore,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
            createdBy: instructor._id,
          });
        }
      }
    }

    // Create course FAQs
    for (const faqDef of preset.faqs) {
      await CourseFAQ.create({
        course: course._id,
        question: faqDef.question,
        answer: faqDef.answer,
        order: faqDef.order,
      });
    }

    // Create course announcements
    for (const annDef of preset.announcements) {
      await Announcement.create({
        course: course._id,
        instructor: instructor._id,
        title: annDef.title,
        body: annDef.body,
      });
    }

    // Sync enrollment lesson count
    await syncEnrollmentLessonCount(course._id.toString());

    result.coursesCreated++;
    result.details.push({
      courseId: course._id.toString(),
      title: course.title,
      status: "created",
      sectionsCount: preset.sections.length,
      lessonsCount: courseLessonsCount,
    });
  }

  return result;
}
