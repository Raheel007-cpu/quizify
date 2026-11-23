require('dotenv/config');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SUBJECTS_DATA = [
  {
    name: 'Programming',
    description: 'Software engineering, web development, backend systems, and databases.',
    categories: [
      { name: 'JavaScript', description: 'Core JS syntax, closures, async patterns, and runtime behavior.' },
      { name: 'React', description: 'Components, hooks, state management, and rendering lifecycle.' },
      { name: 'Node.js', description: 'Event loop, Express APIs, streams, and server-side security.' },
    ],
  },
  {
    name: 'Mathematics',
    description: 'Quantitative reasoning, algebra, geometry, and problem solving.',
    categories: [
      { name: 'Algebra', description: 'Linear equations, polynomials, inequalities, and functions.' },
      { name: 'Geometry', description: 'Angles, triangles, circles, area, and coordinate geometry.' },
    ],
  },
  {
    name: 'Science',
    description: 'Natural sciences covering physics, motion, energy, and matter.',
    categories: [
      { name: 'Physics', description: 'Mechanics, thermodynamics, electricity, and optics.' },
    ],
  },
  {
    name: 'History',
    description: 'Major civilizations, historical turning points, and modern history.',
    categories: [
      { name: 'World History', description: 'Ancient civilizations, revolutions, and global milestones.' },
    ],
  },
  {
    name: 'Geography',
    description: 'Physical geography, continents, climate, and world capitals.',
    categories: [
      { name: 'World Geography', description: 'Oceans, mountain ranges, countries, and natural landmarks.' },
    ],
  },
];

const QUESTIONS_DATA = [
  // JavaScript (8 questions)
  {
    category: 'JavaScript',
    difficulty: 'EASY',
    questionText: 'What does `typeof null` return in JavaScript?',
    optionA: '"null"',
    optionB: '"object"',
    optionC: '"undefined"',
    optionD: '"boolean"',
    correctAnswer: 'B',
    explanation: 'Due to a historic bug in the original JavaScript implementation, typeof null evaluates to "object".',
  },
  {
    category: 'JavaScript',
    difficulty: 'EASY',
    questionText: 'Which keyword declares a block-scoped variable that can be reassigned?',
    optionA: 'var',
    optionB: 'const',
    optionC: 'let',
    optionD: 'static',
    correctAnswer: 'C',
    explanation: 'let creates a block-scoped variable whose binding can be reassigned, unlike const.',
  },
  {
    category: 'JavaScript',
    difficulty: 'EASY',
    questionText: 'Which array method creates a new array with elements that pass a test function?',
    optionA: 'map()',
    optionB: 'forEach()',
    optionC: 'filter()',
    optionD: 'reduce()',
    correctAnswer: 'C',
    explanation: 'Array.prototype.filter() returns a shallow copy containing only elements for which the predicate returns truthy.',
  },
  {
    category: 'JavaScript',
    difficulty: 'MEDIUM',
    questionText: 'What is the output of `Boolean([])` in JavaScript?',
    optionA: 'false',
    optionB: 'true',
    optionC: 'undefined',
    optionD: 'TypeError',
    correctAnswer: 'B',
    explanation: 'All objects in JavaScript—including empty arrays and empty objects—are truthy values.',
  },
  {
    category: 'JavaScript',
    difficulty: 'MEDIUM',
    questionText: 'Which Promise method resolves as soon as ANY of the input promises fulfills?',
    optionA: 'Promise.all()',
    optionB: 'Promise.allSettled()',
    optionC: 'Promise.any()',
    optionD: 'Promise.resolve()',
    correctAnswer: 'C',
    explanation: 'Promise.any() fulfills with the first fulfilled promise, ignoring rejections unless all reject.',
  },
  {
    category: 'JavaScript',
    difficulty: 'MEDIUM',
    questionText: 'What is a closure in JavaScript?',
    optionA: 'A function bundled together with references to its lexical environment',
    optionB: 'A method used to close open network sockets',
    optionC: 'A block statement that prevents variable hoisting',
    optionD: 'A syntax for freezing object properties',
    correctAnswer: 'A',
    explanation: 'A closure allows an inner function to retain access to variables from its outer lexical scope even after the outer function has returned.',
  },
  {
    category: 'JavaScript',
    difficulty: 'HARD',
    questionText: 'In the JavaScript event loop, which queue has higher priority after the call stack empties?',
    optionA: 'Macrotask queue (setTimeout)',
    optionB: 'Microtask queue (Promise callbacks)',
    optionC: 'Animation frame queue',
    optionD: 'I/O polling queue',
    correctAnswer: 'B',
    explanation: 'All pending microtasks (such as Promise.then and queueMicrotask) are drained before the next macrotask runs.',
  },
  {
    category: 'JavaScript',
    difficulty: 'HARD',
    questionText: 'What does `Object.freeze(obj)` do to nested objects inside `obj`?',
    optionA: 'Deeply freezes all nested objects recursively',
    optionB: 'Freezes only top-level properties (shallow freeze)',
    optionC: 'Throws an error if nested objects exist',
    optionD: 'Converts nested objects into read-only Maps',
    correctAnswer: 'B',
    explanation: 'Object.freeze() performs a shallow freeze; properties of nested objects remain mutable unless frozen separately.',
  },

  // React (6 questions)
  {
    category: 'React',
    difficulty: 'EASY',
    questionText: 'Which React hook is used to manage local component state?',
    optionA: 'useEffect',
    optionB: 'useState',
    optionC: 'useContext',
    optionD: 'useRef',
    correctAnswer: 'B',
    explanation: 'useState returns a stateful value and a setter function to update it.',
  },
  {
    category: 'React',
    difficulty: 'EASY',
    questionText: 'Why should list items rendered with `.map()` in React have a unique `key` prop?',
    optionA: 'To style odd and even rows automatically',
    optionB: 'To help React identify which items changed, were added, or were removed',
    optionC: 'To sort items alphabetically in the DOM',
    optionD: 'To enable CSS animations on mount',
    correctAnswer: 'B',
    explanation: 'Stable unique keys let React reconcile list updates accurately without unnecessary DOM re-creation.',
  },
  {
    category: 'React',
    difficulty: 'MEDIUM',
    questionText: 'When does a `useEffect` hook with an empty dependency array `[]` run?',
    optionA: 'On every single render',
    optionB: 'Only once after the initial mount (and cleanup on unmount)',
    optionC: 'Only when props change',
    optionD: 'Never',
    correctAnswer: 'B',
    explanation: 'An empty dependency array tells React the effect does not depend on any props or state, so it runs on mount.',
  },
  {
    category: 'React',
    difficulty: 'MEDIUM',
    questionText: 'Which hook lets you persist a mutable value across renders without triggering a re-render when updated?',
    optionA: 'useMemo',
    optionB: 'useCallback',
    optionC: 'useRef',
    optionD: 'useReducer',
    correctAnswer: 'C',
    explanation: 'Mutating ref.current does not schedule a re-render, making useRef ideal for DOM refs and mutable instance values.',
  },
  {
    category: 'React',
    difficulty: 'HARD',
    questionText: 'What is the main purpose of `useCallback(fn, deps)`?',
    optionA: 'To cache the return value of an expensive calculation',
    optionB: 'To memoize the function reference itself between renders unless dependencies change',
    optionC: 'To force synchronous DOM updates',
    optionD: 'To replace Redux in large applications',
    correctAnswer: 'B',
    explanation: 'useCallback preserves function identity across renders, helping prevent unnecessary re-renders of memoized child components.',
  },
  {
    category: 'React',
    difficulty: 'HARD',
    questionText: 'In React Router v6, which component renders matched child routes inside a parent layout route?',
    optionA: '<Switch />',
    optionB: '<Outlet />',
    optionC: '<Redirect />',
    optionD: '<Portal />',
    correctAnswer: 'B',
    explanation: '<Outlet /> acts as a placeholder in parent route elements where nested child routes render.',
  },

  // Node.js (5 questions)
  {
    category: 'Node.js',
    difficulty: 'EASY',
    questionText: 'Which Express middleware parses incoming JSON request bodies?',
    optionA: 'express.static()',
    optionB: 'express.json()',
    optionC: 'express.Router()',
    optionD: 'express.rawText()',
    correctAnswer: 'B',
    explanation: 'express.json() parses requests with JSON payloads and populates req.body.',
  },
  {
    category: 'Node.js',
    difficulty: 'MEDIUM',
    questionText: 'How does Express recognize an error-handling middleware function?',
    optionA: 'By naming the function errorHandler',
    optionB: 'By having four parameters: (err, req, res, next)',
    optionC: 'By placing it before all routes',
    optionD: 'By returning a rejected Promise',
    correctAnswer: 'B',
    explanation: 'Express identifies error-handling middleware by its arity of 4 arguments: (err, req, res, next).',
  },
  {
    category: 'Node.js',
    difficulty: 'MEDIUM',
    questionText: 'Why should passwords be stored with bcrypt instead of SHA-256?',
    optionA: 'SHA-256 is too slow for login requests',
    optionB: 'bcrypt includes salting and configurable work factor to resist brute-force attacks',
    optionC: 'bcrypt allows passwords to be decrypted by admins',
    optionD: 'SHA-256 only hashes numeric strings',
    correctAnswer: 'B',
    explanation: 'Adaptive key-stretching hashes like bcrypt are intentionally slow and salted, protecting against rainbow tables and GPU cracking.',
  },
  {
    category: 'Node.js',
    difficulty: 'MEDIUM',
    questionText: 'What HTTP status code should an API return when an authenticated user lacks role permissions?',
    optionA: '400 Bad Request',
    optionB: '401 Unauthorized',
    optionC: '403 Forbidden',
    optionD: '409 Conflict',
    correctAnswer: 'C',
    explanation: '401 indicates missing or invalid authentication; 403 indicates the user is known but lacks permission.',
  },
  {
    category: 'Node.js',
    difficulty: 'HARD',
    questionText: 'Why should `httpOnly: true` be set on cookies storing JWT session tokens?',
    optionA: 'To compress the cookie automatically',
    optionB: 'To prevent client-side JavaScript (and XSS scripts) from reading document.cookie',
    optionC: 'To allow cross-origin requests without CORS',
    optionD: 'To make the cookie persist forever',
    correctAnswer: 'B',
    explanation: 'HttpOnly cookies cannot be accessed via document.cookie in the browser, mitigating token theft via XSS.',
  },

  // Algebra (5 questions)
  {
    category: 'Algebra',
    difficulty: 'EASY',
    questionText: 'Solve for x: 3x + 7 = 22',
    optionA: '3',
    optionB: '4',
    optionC: '5',
    optionD: '6',
    correctAnswer: 'C',
    explanation: 'Subtract 7 from both sides to get 3x = 15, then divide by 3 to get x = 5.',
  },
  {
    category: 'Algebra',
    difficulty: 'EASY',
    questionText: 'What is the slope of the line y = 4x - 9?',
    optionA: '-9',
    optionB: '4',
    optionC: '9',
    optionD: '1/4',
    correctAnswer: 'B',
    explanation: 'In slope-intercept form y = mx + b, m is the slope, which is 4.',
  },
  {
    category: 'Algebra',
    difficulty: 'MEDIUM',
    questionText: 'Factor the quadratic expression: x^2 - 9',
    optionA: '(x - 3)(x - 3)',
    optionB: '(x + 3)(x - 3)',
    optionC: '(x + 9)(x - 1)',
    optionD: '(x + 3)(x + 3)',
    correctAnswer: 'B',
    explanation: 'x^2 - 9 is a difference of squares: a^2 - b^2 = (a + b)(a - b).',
  },
  {
    category: 'Algebra',
    difficulty: 'MEDIUM',
    questionText: 'If f(x) = 2x^2 - 3x + 1, what is f(2)?',
    optionA: '3',
    optionB: '5',
    optionC: '7',
    optionD: '1',
    correctAnswer: 'A',
    explanation: 'f(2) = 2(4) - 3(2) + 1 = 8 - 6 + 1 = 3.',
  },
  {
    category: 'Algebra',
    difficulty: 'HARD',
    questionText: 'For what values of k does x^2 + kx + 9 = 0 have exactly one real root?',
    optionA: 'k = 3 or -3',
    optionB: 'k = 6 or -6',
    optionC: 'k = 9 or -9',
    optionD: 'k = 0',
    correctAnswer: 'B',
    explanation: 'A quadratic has one real root when discriminant b^2 - 4ac = 0: k^2 - 36 = 0, so k = ±6.',
  },

  // Geometry (4 questions)
  {
    category: 'Geometry',
    difficulty: 'EASY',
    questionText: 'What is the sum of interior angles of any triangle?',
    optionA: '90 degrees',
    optionB: '180 degrees',
    optionC: '270 degrees',
    optionD: '360 degrees',
    correctAnswer: 'B',
    explanation: 'In Euclidean geometry, the three interior angles of a triangle always sum to 180 degrees.',
  },
  {
    category: 'Geometry',
    difficulty: 'EASY',
    questionText: 'A rectangle has length 8 cm and width 5 cm. What is its perimeter?',
    optionA: '13 cm',
    optionB: '26 cm',
    optionC: '40 cm',
    optionD: '20 cm',
    correctAnswer: 'B',
    explanation: 'Perimeter = 2 × (length + width) = 2 × (8 + 5) = 26 cm.',
  },
  {
    category: 'Geometry',
    difficulty: 'MEDIUM',
    questionText: 'What is the hypotenuse of a right triangle with legs of 6 and 8?',
    optionA: '10',
    optionB: '12',
    optionC: '14',
    optionD: '48',
    correctAnswer: 'A',
    explanation: 'By the Pythagorean theorem, sqrt(6^2 + 8^2) = sqrt(36 + 64) = sqrt(100) = 10.',
  },
  {
    category: 'Geometry',
    difficulty: 'HARD',
    questionText: 'If the radius of a circle is doubled, how does its area change?',
    optionA: 'Doubles (2x)',
    optionB: 'Triples (3x)',
    optionC: 'Quadruples (4x)',
    optionD: 'Increases by 8x',
    correctAnswer: 'C',
    explanation: 'Area = πr^2. Replacing r with 2r gives π(2r)^2 = 4πr^2, which is 4 times larger.',
  },

  // Physics (4 questions)
  {
    category: 'Physics',
    difficulty: 'EASY',
    questionText: 'What is the SI unit of force?',
    optionA: 'Joule',
    optionB: 'Watt',
    optionC: 'Newton',
    optionD: 'Pascal',
    correctAnswer: 'C',
    explanation: 'Force is measured in Newtons (N), equivalent to kg·m/s^2.',
  },
  {
    category: 'Physics',
    difficulty: 'MEDIUM',
    questionText: 'According to Ohm’s Law, how are voltage (V), current (I), and resistance (R) related?',
    optionA: 'V = I / R',
    optionB: 'V = I × R',
    optionC: 'I = V × R',
    optionD: 'R = V × I',
    correctAnswer: 'B',
    explanation: 'Ohm’s Law states that voltage across a conductor equals current multiplied by resistance (V = IR).',
  },
  {
    category: 'Physics',
    difficulty: 'MEDIUM',
    questionText: 'What is the approximate acceleration due to gravity near Earth’s surface?',
    optionA: '3.7 m/s^2',
    optionB: '9.8 m/s^2',
    optionC: '14.2 m/s^2',
    optionD: '1.6 m/s^2',
    correctAnswer: 'B',
    explanation: 'Standard gravity on Earth is approximately 9.81 m/s^2.',
  },
  {
    category: 'Physics',
    difficulty: 'HARD',
    questionText: 'If an object’s velocity triples while its mass stays constant, what happens to its kinetic energy?',
    optionA: 'It triples (3x)',
    optionB: 'It increases by 6x',
    optionC: 'It increases by 9x',
    optionD: 'It stays the same',
    correctAnswer: 'C',
    explanation: 'Kinetic energy is KE = 1/2 mv^2, so tripling v multiplies kinetic energy by 3^2 = 9.',
  },

  // World History (4 questions)
  {
    category: 'World History',
    difficulty: 'EASY',
    questionText: 'In which year did the Apollo 11 mission first land humans on the Moon?',
    optionA: '1965',
    optionB: '1969',
    optionC: '1972',
    optionD: '1959',
    correctAnswer: 'B',
    explanation: 'Neil Armstrong and Buzz Aldrin landed on the Moon on July 20, 1969.',
  },
  {
    category: 'World History',
    difficulty: 'EASY',
    questionText: 'Which ancient civilization built Machu Picchu?',
    optionA: 'Maya',
    optionB: 'Aztec',
    optionC: 'Inca',
    optionD: 'Olmec',
    correctAnswer: 'C',
    explanation: 'Machu Picchu was built by the Inca Empire in the 15th century in modern-day Peru.',
  },
  {
    category: 'World History',
    difficulty: 'MEDIUM',
    questionText: 'Who invented the movable-type printing press in Europe around 1440?',
    optionA: 'Leonardo da Vinci',
    optionB: 'Johannes Gutenberg',
    optionC: 'Galileo Galilei',
    optionD: 'Isaac Newton',
    correctAnswer: 'B',
    explanation: 'Johannes Gutenberg introduced the mechanical movable-type printing press in Europe.',
  },
  {
    category: 'World History',
    difficulty: 'HARD',
    questionText: 'Which treaty formally ended World War I between Germany and the Allied Powers in 1919?',
    optionA: 'Treaty of Tordesillas',
    optionB: 'Treaty of Westphalia',
    optionC: 'Treaty of Versailles',
    optionD: 'Treaty of Utrecht',
    correctAnswer: 'C',
    explanation: 'The Treaty of Versailles was signed on June 28, 1919, formally ending WWI with Germany.',
  },

  // World Geography (4 questions)
  {
    category: 'World Geography',
    difficulty: 'EASY',
    questionText: 'Which is the largest ocean on Earth?',
    optionA: 'Atlantic Ocean',
    optionB: 'Indian Ocean',
    optionC: 'Pacific Ocean',
    optionD: 'Arctic Ocean',
    correctAnswer: 'C',
    explanation: 'The Pacific Ocean covers roughly 30% of Earth’s surface, making it the largest ocean.',
  },
  {
    category: 'World Geography',
    difficulty: 'EASY',
    questionText: 'What is the capital city of Japan?',
    optionA: 'Kyoto',
    optionB: 'Osaka',
    optionC: 'Tokyo',
    optionD: 'Yokohama',
    correctAnswer: 'C',
    explanation: 'Tokyo has been Japan’s capital since 1868.',
  },
  {
    category: 'World Geography',
    difficulty: 'MEDIUM',
    questionText: 'Which river flows through Cairo and is traditionally considered the longest river in Africa?',
    optionA: 'Congo River',
    optionB: 'Nile River',
    optionC: 'Zambezi River',
    optionD: 'Niger River',
    correctAnswer: 'B',
    explanation: 'The Nile River flows northward through northeastern Africa and passes through Cairo.',
  },
  {
    category: 'World Geography',
    difficulty: 'HARD',
    questionText: 'Which country spans the most time zones when including its overseas territories?',
    optionA: 'Russia',
    optionB: 'United States',
    optionC: 'France',
    optionD: 'Canada',
    correctAnswer: 'C',
    explanation: 'Because of its overseas departments and territories worldwide, France spans 12 time zones.',
  },
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development seed script must not run in production.');
  }

  console.log('Seeding Quizify database...');

  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@1234';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'Student@1234';

  const [adminHash, studentHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(studentPassword, 12),
  ]);

  await prisma.user.upsert({
    where: { email: 'admin@quizify.dev' },
    update: {},
    create: {
      name: 'Quizify Admin',
      email: 'admin@quizify.dev',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  const sampleStudents = [
    { name: 'Alex Rivera', email: 'alex@quizify.dev' },
    { name: 'Sarah Chen', email: 'sarah@quizify.dev' },
    { name: 'Jordan Patel', email: 'jordan@quizify.dev' },
  ];

  for (const student of sampleStudents) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        name: student.name,
        email: student.email,
        passwordHash: studentHash,
        role: 'STUDENT',
      },
    });
  }

  // Upsert Subjects & Categories
  const categoryMap = new Map();

  for (const subjectItem of SUBJECTS_DATA) {
    const subject = await prisma.subject.upsert({
      where: { name: subjectItem.name },
      update: { description: subjectItem.description },
      create: {
        name: subjectItem.name,
        description: subjectItem.description,
      },
    });

    for (const catItem of subjectItem.categories) {
      const category = await prisma.category.upsert({
        where: {
          subjectId_name: {
            subjectId: subject.id,
            name: catItem.name,
          },
        },
        update: { description: catItem.description },
        create: {
          subjectId: subject.id,
          name: catItem.name,
          description: catItem.description,
        },
      });
      categoryMap.set(catItem.name, category);
    }
  }

  // Seed Question Bank idempotently by questionText
  const existingQuestionCount = await prisma.question.count();
  if (existingQuestionCount === 0) {
    for (const q of QUESTIONS_DATA) {
      const category = categoryMap.get(q.category);
      if (!category) continue;

      await prisma.question.create({
        data: {
          categoryId: category.id,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          difficulty: q.difficulty,
        },
      });
    }
  }

  // Seed Sample Quizzes idempotently if none exist
  const existingQuizCount = await prisma.quiz.count();
  if (existingQuizCount === 0) {
    const quizzesToCreate = [
      {
        title: 'JavaScript Fundamentals',
        description: 'Core JavaScript concepts including types, scope, closures, and async promises.',
        categoryName: 'JavaScript',
        difficulty: 'MEDIUM',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 6,
        status: 'PUBLISHED',
      },
      {
        title: 'React Hooks & Routing Essentials',
        description: 'Test your understanding of React state, effects, refs, and routing.',
        categoryName: 'React',
        difficulty: 'MEDIUM',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 5,
        status: 'PUBLISHED',
      },
      {
        title: 'Node.js & Express Security Basics',
        description: 'Middleware, HTTP status codes, authentication, and secure cookie patterns.',
        categoryName: 'Node.js',
        difficulty: 'HARD',
        timeLimit: 6,
        passingScore: 70,
        questionCount: 5,
        status: 'PUBLISHED',
      },
      {
        title: 'Algebra Essentials',
        description: 'Linear equations, slopes, quadratics, and function evaluation.',
        categoryName: 'Algebra',
        difficulty: 'EASY',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 5,
        status: 'PUBLISHED',
      },
      {
        title: 'Geometry & Physics Quick Check',
        description: 'Foundational triangle geometry and mechanics concepts.',
        categoryName: 'Geometry',
        difficulty: 'EASY',
        timeLimit: 4,
        passingScore: 60,
        questionCount: 4,
        status: 'PUBLISHED',
      },
      {
        title: 'World History Milestones (Draft)',
        description: 'Key events from ancient empires through modern history.',
        categoryName: 'World History',
        difficulty: 'MEDIUM',
        timeLimit: 5,
        passingScore: 60,
        questionCount: 4,
        status: 'DRAFT',
      },
    ];

    for (const quizData of quizzesToCreate) {
      const category = categoryMap.get(quizData.categoryName);
      if (!category) continue;

      const bankQuestions = await prisma.question.findMany({
        where: { categoryId: category.id },
        select: { id: true },
      });

      const quiz = await prisma.quiz.create({
        data: {
          categoryId: category.id,
          title: quizData.title,
          description: quizData.description,
          difficulty: quizData.difficulty,
          timeLimit: quizData.timeLimit,
          passingScore: quizData.passingScore,
          questionCount: Math.min(quizData.questionCount, bankQuestions.length),
          status: quizData.status,
        },
      });

      if (bankQuestions.length > 0) {
        await prisma.quizQuestion.createMany({
          data: bankQuestions.map((q) => ({
            quizId: quiz.id,
            questionId: q.id,
          })),
          skipDuplicates: true,
        });
      }
    }
  }

  console.log('Quizify seed completed successfully.');
}

seed()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
