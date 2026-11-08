export type ArchitectureLayer = { layer: string; nodes: string[] };

export type CaseStudy = {
  status: string;
  problem: string;
  approach: string;
  architecture: ArchitectureLayer[];
  features: string[];
  next?: string[];
};

export type Project = {
  n: string;
  title: string;
  type: string;
  year: string;
  desc: string;
  stack: string[];
  detail: string;
  tone: string;
  mark: string;
  links?: { github?: string; live?: string }; // add real URLs here when public
  caseStudy: CaseStudy;
};

export const projects: Project[] = [
  {
    n: '01',
    title: 'MechanicAI',
    type: 'PRODUCT CONCEPT · FULL-STACK',
    year: 'BUILD IN PROGRESS',
    desc: 'A digital-first automotive service concept exploring how a clearer online experience can make vehicle care easier to navigate.',
    stack: ['Next.js', 'Expo React Native', 'Supabase', 'Groq API', 'Tailwind CSS'],
    detail:
      'A product-led build exploring the intersection of AI-assisted workflows and a practical service experience. The public case study will be expanded with verified implementation details and a repository link.',
    tone: 'lime',
    mark: 'M / AI',
    caseStudy: {
      status: 'Active development',
      problem:
        'When a vehicle develops a problem, drivers often cannot tell what is wrong, how serious it is, or what to do next. MechanicAI explores an AI assistant that makes that first step clearer.',
      approach:
        'A mobile-first product: a native app backed by a Next.js API. Drivers can browse as guests, try a few free AI chats, and sign up when they want to continue. The home screen leads with an SOS action for urgent situations.',
      architecture: [
        { layer: 'Client', nodes: ['Expo React Native app'] },
        { layer: 'Backend', nodes: ['Next.js 14 API routes', 'Streaming endpoints', 'Vercel'] },
        { layer: 'AI', nodes: ['Groq API (hosted LLM)'] },
        { layer: 'Data', nodes: ['Supabase auth', 'Supabase database'] },
      ],
      features: [
        'SOS-first home screen for urgent situations',
        'Guest access with a few free chats before sign-up',
        'Email sign-up and sign-in, with password reset by emailed code',
        'AI diagnosis chat powered by a Groq-hosted LLM',
      ],
      next: [
        'Voice assistant mode',
        'Camera scan to diagnose from a photo',
        'Nearby workshops using OpenStreetMap data',
        'Parts price comparison',
      ],
    },
  },
  {
    n: '02',
    title: 'Credit Card Fraud Detection',
    type: 'APPLIED MACHINE LEARNING',
    year: 'ACADEMIC PROJECT',
    desc: 'An applied machine-learning workflow using the Kaggle credit-card fraud dataset, with an emphasis on exploratory analysis and imbalanced classification.',
    stack: ['Python', 'Pandas', 'Scikit-learn', 'EDA', 'Classification'],
    detail:
      'The workflow examines transaction data, data preparation and class imbalance. Model comparisons and evaluation should be documented alongside the final notebook and verified results.',
    tone: 'blue',
    mark: '0 / 1',
    caseStudy: {
      status: 'Academic project',
      problem:
        'Fraudulent transactions are a tiny fraction of all card activity, so a model that labels everything legitimate can look accurate while catching nothing. Imbalance is the central challenge.',
      approach:
        'Explore the Kaggle credit-card fraud dataset, prepare the data, and treat the task as an imbalanced-classification problem.',
      architecture: [
        { layer: 'Data', nodes: ['Kaggle credit-card fraud dataset'] },
        { layer: 'Preparation', nodes: ['Exploratory analysis', 'Data preparation'] },
        { layer: 'Modelling', nodes: ['Classification', 'Class-imbalance handling'] },
        { layer: 'Evaluation', nodes: ['Model evaluation'] },
      ],
      features: [
        'Exploratory data analysis of transaction data',
        'Data preparation for modelling',
        'Imbalanced-classification workflow',
      ],
      next: ['Document model comparisons and verified results', 'Publish the final notebook'],
    },
  },
  {
    n: '03',
    title: 'Emotion Detection API',
    type: 'IBM COURSE PROJECT · NLP',
    year: 'COMPLETED COURSE PROJECT',
    desc: 'A Flask application that sends text to an emotion inference service and presents the resulting emotion scores through an HTTP endpoint.',
    stack: ['Python', 'Flask', 'NLP', 'REST API', 'IBM Watson'],
    detail:
      'An applied integration exercise covering request handling, inference-service integration and structured output including the dominant emotion.',
    tone: 'orange',
    mark: ':)',
    caseStudy: {
      status: 'Completed course project',
      problem:
        'Turn free text into structured emotion scores that other software can consume.',
      approach:
        'A Flask application accepts text, sends it to an emotion inference service, and returns the emotion scores, including the dominant emotion, from an HTTP endpoint.',
      architecture: [
        { layer: 'Request', nodes: ['Text input'] },
        { layer: 'Application', nodes: ['Flask endpoint'] },
        { layer: 'Inference', nodes: ['IBM Watson NLP'] },
        { layer: 'Response', nodes: ['Emotion scores', 'Dominant emotion'] },
      ],
      features: [
        'HTTP endpoint for emotion analysis',
        'Integration with an inference service',
        'Structured output including the dominant emotion',
      ],
    },
  },
];