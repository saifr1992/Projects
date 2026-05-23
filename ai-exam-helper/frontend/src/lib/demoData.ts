import type {
  ChatMessage,
  ChatSession,
  ChatSessionDetail,
  Paper,
  Quiz,
  QuizHistoryItem,
  QuizQuestionPublic,
  QuizResultItem,
  QuizSubmission,
  User,
} from "./types";

type StoredQuiz = Quiz & {
  correct_indices: number[];
  explanations: string[];
};

type Stats = {
  users: number;
  students: number;
  papers: number;
  quizzes: number;
};

type DemoState = {
  users: User[];
  passwords: Record<string, string>;
  papers: Paper[];
  sessions: ChatSessionDetail[];
  quizzes: StoredQuiz[];
  nextUserId: number;
  nextPaperId: number;
  nextSessionId: number;
  nextMessageId: number;
  nextQuizId: number;
};

const nowIso = () => new Date().toISOString();
const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

function seed(): DemoState {
  const users: User[] = [
    {
      id: 1,
      email: "admin@examhelper.com",
      name: "Demo Admin",
      role: "admin",
      created_at: daysAgo(120),
    },
    {
      id: 2,
      email: "student@examhelper.com",
      name: "Demo Student",
      role: "student",
      created_at: daysAgo(40),
    },
    {
      id: 3,
      email: "ali.khan@example.com",
      name: "Ali Khan",
      role: "student",
      created_at: daysAgo(25),
    },
    {
      id: 4,
      email: "fatima.malik@example.com",
      name: "Fatima Malik",
      role: "student",
      created_at: daysAgo(12),
    },
  ];

  const passwords: Record<string, string> = {
    "admin@examhelper.com": "Admin@12345",
    "student@examhelper.com": "Student@12345",
    "ali.khan@example.com": "Student@12345",
    "fatima.malik@example.com": "Student@12345",
  };

  const papers: Paper[] = [
    {
      id: 1,
      title: "Data Structures Final 2024",
      subject: "Computer Science",
      year: 2024,
      semester: "Fall",
      description: "Arrays, linked lists, trees, graphs and complexity analysis.",
      file_name: "ds-final-2024.pdf",
      uploaded_by: 1,
      created_at: daysAgo(60),
    },
    {
      id: 2,
      title: "Algorithms Midterm 2023",
      subject: "Computer Science",
      year: 2023,
      semester: "Spring",
      description: "Sorting, divide & conquer, dynamic programming.",
      file_name: "algo-mid-2023.pdf",
      uploaded_by: 1,
      created_at: daysAgo(180),
    },
    {
      id: 3,
      title: "Operating Systems Final 2024",
      subject: "Computer Science",
      year: 2024,
      semester: "Spring",
      description: "Processes, threads, scheduling, memory management.",
      file_name: "os-final-2024.pdf",
      uploaded_by: 1,
      created_at: daysAgo(90),
    },
    {
      id: 4,
      title: "Linear Algebra Midterm 2024",
      subject: "Mathematics",
      year: 2024,
      semester: "Spring",
      description: "Vector spaces, eigenvalues, linear transformations.",
      file_name: "linalg-mid-2024.pdf",
      uploaded_by: 1,
      created_at: daysAgo(70),
    },
    {
      id: 5,
      title: "Calculus II Final 2023",
      subject: "Mathematics",
      year: 2023,
      semester: "Fall",
      description: "Integration techniques, series, multivariable basics.",
      file_name: "calc2-final-2023.pdf",
      uploaded_by: 1,
      created_at: daysAgo(200),
    },
    {
      id: 6,
      title: "Physics I Final 2024",
      subject: "Physics",
      year: 2024,
      semester: "Fall",
      description: "Mechanics, kinematics, energy, momentum.",
      file_name: "phys1-final-2024.pdf",
      uploaded_by: 1,
      created_at: daysAgo(45),
    },
  ];

  const sessions: ChatSessionDetail[] = [
    {
      id: 1,
      title: "Explain Big-O notation",
      created_at: daysAgo(5),
      messages: [
        {
          id: 1,
          role: "user",
          content: "Can you explain Big-O notation with a simple example?",
          created_at: daysAgo(5),
        },
        {
          id: 2,
          role: "assistant",
          content:
            "**Big-O notation** describes how an algorithm's running time grows as the input size `n` increases — it captures the *worst-case* upper bound.\n\n- `O(1)` — constant time. Example: looking up an array element by index.\n- `O(n)` — linear time. Example: scanning a list once.\n- `O(n log n)` — typical for efficient sorts like merge sort.\n- `O(n²)` — nested loops over the same input, like bubble sort.\n\n**Example:** finding the max in an unsorted array is `O(n)` because you must inspect every element once.",
          created_at: daysAgo(5),
        },
      ],
    },
    {
      id: 2,
      title: "Process vs thread",
      created_at: daysAgo(2),
      messages: [
        {
          id: 3,
          role: "user",
          content: "What's the difference between a process and a thread?",
          created_at: daysAgo(2),
        },
        {
          id: 4,
          role: "assistant",
          content:
            "A **process** is an independent program in execution with its own memory space, while a **thread** is a lightweight unit of execution *inside* a process that shares memory with other threads of the same process.\n\n| Aspect | Process | Thread |\n|---|---|---|\n| Memory | Isolated | Shared within process |\n| Creation cost | High | Low |\n| Communication | IPC (pipes, sockets) | Shared variables |\n| Crash impact | Doesn't kill other processes | Can crash entire process |\n\nUse threads when tasks share data closely; use separate processes when isolation matters.",
          created_at: daysAgo(2),
        },
      ],
    },
  ];

  const quizzes: StoredQuiz[] = [
    {
      id: 1,
      paper_id: 1,
      topic: "Data Structures",
      questions: [
        {
          question: "Which data structure uses LIFO order?",
          options: ["Queue", "Stack", "Linked List", "Hash Map"],
        },
        {
          question: "What is the time complexity of binary search?",
          options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
        },
        {
          question: "Which traversal visits the root last?",
          options: ["Pre-order", "In-order", "Post-order", "Level-order"],
        },
      ],
      correct_indices: [1, 1, 2],
      explanations: [
        "Stacks are Last-In-First-Out — the most recently pushed item is the first popped.",
        "Binary search halves the search space each step, giving O(log n).",
        "Post-order traversal visits left, then right, then root.",
      ],
      total: 3,
      submitted: true,
      score: 100,
      created_at: daysAgo(7),
    },
    {
      id: 2,
      paper_id: null,
      topic: "Calculus",
      questions: [
        {
          question: "What is the derivative of sin(x)?",
          options: ["cos(x)", "-cos(x)", "sin(x)", "-sin(x)"],
        },
        {
          question: "∫ 1/x dx equals?",
          options: ["x ln(x)", "ln|x| + C", "1/x² + C", "e^x + C"],
        },
      ],
      correct_indices: [0, 1],
      explanations: [
        "By standard derivative rules, d/dx[sin(x)] = cos(x).",
        "The integral of 1/x is the natural logarithm of |x| plus a constant.",
      ],
      total: 2,
      submitted: true,
      score: 50,
      created_at: daysAgo(3),
    },
  ];

  return {
    users,
    passwords,
    papers,
    sessions,
    quizzes,
    nextUserId: 5,
    nextPaperId: 7,
    nextSessionId: 3,
    nextMessageId: 5,
    nextQuizId: 3,
  };
}

const state: DemoState = seed();

const QUESTION_BANK: Array<
  QuizQuestionPublic & { correct_index: number; explanation: string }
> = [
  {
    question: "Which data structure uses LIFO (Last-In-First-Out) order?",
    options: ["Queue", "Stack", "Heap", "Hash Map"],
    correct_index: 1,
    explanation: "Stacks follow LIFO — push adds on top, pop removes from top.",
  },
  {
    question: "What is the worst-case time complexity of quicksort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    correct_index: 2,
    explanation:
      "Quicksort degrades to O(n²) when pivots split the array very unevenly (e.g., already sorted input with naive pivot choice).",
  },
  {
    question: "Which traversal of a BST yields sorted output?",
    options: ["Pre-order", "In-order", "Post-order", "Level-order"],
    correct_index: 1,
    explanation:
      "In-order traversal of a binary search tree visits nodes in ascending key order.",
  },
  {
    question: "A hash table's average lookup time is:",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct_index: 0,
    explanation:
      "With a good hash function and load factor, hash table operations average O(1).",
  },
  {
    question:
      "Which scheduling algorithm can cause starvation if priorities never change?",
    options: ["Round Robin", "FCFS", "Priority (non-preemptive)", "SJF preemptive"],
    correct_index: 2,
    explanation:
      "Pure priority scheduling can starve low-priority jobs forever; aging is the usual remedy.",
  },
  {
    question: "What is the derivative of cos(x)?",
    options: ["sin(x)", "-sin(x)", "-cos(x)", "tan(x)"],
    correct_index: 1,
    explanation: "d/dx[cos(x)] = -sin(x).",
  },
  {
    question: "An eigenvector v of A satisfies:",
    options: ["Av = 0", "Av = v", "Av = λv for some scalar λ", "A = vᵀv"],
    correct_index: 2,
    explanation:
      "By definition, v is an eigenvector if Av is a scalar multiple of v; that scalar is the eigenvalue λ.",
  },
  {
    question: "Newton's second law states:",
    options: ["F = mv", "F = ma", "E = mc²", "p = mv"],
    correct_index: 1,
    explanation:
      "Net force on a body equals its mass times acceleration: F = ma.",
  },
  {
    question: "Which sorting algorithm is stable and runs in O(n log n)?",
    options: ["Heap sort", "Quick sort", "Merge sort", "Selection sort"],
    correct_index: 2,
    explanation:
      "Merge sort is both stable (preserves equal-element order) and O(n log n) in the worst case.",
  },
  {
    question: "Which of the following best describes a deadlock?",
    options: [
      "A process waiting on I/O",
      "Two or more processes each waiting for a resource the other holds",
      "A process consuming 100% CPU",
      "An operation that times out",
    ],
    correct_index: 1,
    explanation:
      "Deadlock is a cycle of waiting: each process holds resources and waits on others held by peers.",
  },
  {
    question: "Big-O of accessing an array element by index?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct_index: 0,
    explanation:
      "Array indexing is constant time — the address is computed directly from the index.",
  },
  {
    question: "∫ e^x dx equals:",
    options: ["x·e^x + C", "e^x + C", "ln(x) + C", "1/e^x + C"],
    correct_index: 1,
    explanation:
      "e^x is its own antiderivative (up to the constant of integration).",
  },
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pickQuestions(n: number) {
  return shuffle(QUESTION_BANK).slice(0, Math.min(n, QUESTION_BANK.length));
}

function mockAssistantReply(content: string, paperId?: number): string {
  const lower = content.toLowerCase();
  const paperNote =
    paperId !== undefined
      ? `*(Context: paper #${paperId} — ${state.papers.find((p) => p.id === paperId)?.title ?? "unknown"})*\n\n`
      : "";

  if (lower.includes("big-o") || lower.includes("big o") || lower.includes("complexity")) {
    return (
      paperNote +
      "**Big-O notation** captures how an algorithm scales with input size `n`, focusing on the dominant term.\n\n- `O(1)` — constant\n- `O(log n)` — halving the work each step (e.g., binary search)\n- `O(n)` — single pass\n- `O(n log n)` — efficient comparison sorts\n- `O(n²)` — nested iteration\n\nFocus on the **worst case** unless told otherwise, and drop constants & lower-order terms."
    );
  }
  if (lower.includes("dynamic programming") || lower.includes(" dp ")) {
    return (
      paperNote +
      "**Dynamic programming** solves problems by breaking them into overlapping subproblems and caching their results.\n\n1. Define the state.\n2. Write the recurrence.\n3. Identify base cases.\n4. Choose top-down (memoization) or bottom-up (tabulation).\n\nClassic examples: Fibonacci, longest common subsequence, 0/1 knapsack, edit distance."
    );
  }
  if (lower.includes("recursion")) {
    return (
      paperNote +
      "**Recursion** is a function calling itself on smaller inputs until a base case is reached.\n\nKey ingredients:\n1. **Base case** — stops the recursion.\n2. **Recursive case** — reduces toward the base case.\n3. **Trust the recursion** — assume the recursive call works for smaller inputs.\n\nWatch for stack depth; consider iterative or tail-recursive versions for very deep recursion."
    );
  }
  if (lower.includes("derivative") || lower.includes("differentiat")) {
    return (
      paperNote +
      "The **derivative** measures the instantaneous rate of change of a function.\n\nCommon rules:\n- Power: d/dx[xⁿ] = n·xⁿ⁻¹\n- Sum: derivative distributes over addition\n- Product: (fg)' = f'g + fg'\n- Chain: d/dx[f(g(x))] = f'(g(x))·g'(x)\n\nExample: d/dx[3x² + sin(x)] = 6x + cos(x)."
    );
  }
  if (lower.includes("integral") || lower.includes("integrat")) {
    return (
      paperNote +
      "**Integration** is the reverse of differentiation, producing antiderivatives or computing accumulated areas.\n\nUseful techniques:\n- **Substitution** — reverse the chain rule.\n- **Integration by parts** — ∫u dv = uv − ∫v du.\n- **Partial fractions** — break rational functions into simpler pieces.\n\nDon't forget the `+ C` for indefinite integrals."
    );
  }
  return (
    paperNote +
    "Here's a quick take on your question:\n\n1. **Key idea** — identify what's being asked and the core concept at play.\n2. **Reasoning** — work through the problem step by step, showing each transformation.\n3. **Result** — state the answer and double-check the units / edge cases.\n\nWant me to dive deeper into any specific step? Paste the exact question and I'll walk through it."
  );
}

function sessionToList(s: ChatSessionDetail): ChatSession {
  return { id: s.id, title: s.title, created_at: s.created_at };
}

function quizToHistory(q: StoredQuiz): QuizHistoryItem {
  return {
    id: q.id,
    topic: q.topic,
    paper_id: q.paper_id,
    total: q.total,
    score: q.score,
    submitted: q.submitted,
    created_at: q.created_at,
  };
}

function publicQuiz(q: StoredQuiz): Quiz {
  return {
    id: q.id,
    paper_id: q.paper_id,
    topic: q.topic,
    questions: q.questions,
    total: q.total,
    submitted: q.submitted,
    score: q.score,
    created_at: q.created_at,
  };
}

export const demoApi = {
  login(email: string, password: string) {
    const user = state.users.find((u) => u.email === email);
    if (!user || state.passwords[email] !== password) {
      const e: any = new Error("Invalid email or password");
      e.status = 400;
      e.detail = "Invalid email or password";
      throw e;
    }
    return { access_token: `demo-${user.id}`, user };
  },
  signup(name: string, email: string, password: string) {
    if (state.users.some((u) => u.email === email)) {
      const e: any = new Error("Email already registered");
      e.status = 400;
      e.detail = "Email already registered";
      throw e;
    }
    const user: User = {
      id: state.nextUserId++,
      email,
      name,
      role: "student",
      created_at: nowIso(),
    };
    state.users.push(user);
    state.passwords[email] = password;
    return { access_token: `demo-${user.id}`, user };
  },
  getMeFromToken(token: string | null): User | null {
    if (!token) return null;
    const match = /^demo-(\d+)$/.exec(token);
    if (!match) return null;
    return state.users.find((u) => u.id === Number(match[1])) ?? null;
  },

  listPapers(q?: string, subject?: string, year?: number): Paper[] {
    return state.papers.filter((p) => {
      if (year !== undefined && p.year !== year) return false;
      if (subject && p.subject !== subject) return false;
      if (q) {
        const hay = `${p.title} ${p.description ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  },
  listSubjects(): string[] {
    return Array.from(new Set(state.papers.map((p) => p.subject))).sort();
  },
  uploadPaper(input: {
    title: string;
    subject: string;
    year: number;
    semester?: string;
    description?: string;
    file_name?: string;
  }, userId: number): Paper {
    const paper: Paper = {
      id: state.nextPaperId++,
      title: input.title,
      subject: input.subject,
      year: input.year,
      semester: input.semester || null,
      description: input.description || null,
      file_name: input.file_name || `${input.title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
      uploaded_by: userId,
      created_at: nowIso(),
    };
    state.papers.unshift(paper);
    return paper;
  },
  deletePaper(id: number) {
    state.papers = state.papers.filter((p) => p.id !== id);
  },

  listSessions(): ChatSession[] {
    return [...state.sessions]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(sessionToList);
  },
  getSession(id: number): ChatSessionDetail | null {
    return state.sessions.find((s) => s.id === id) ?? null;
  },
  sendMessage(content: string, sessionId?: number, paperId?: number) {
    let session = sessionId !== undefined ? state.sessions.find((s) => s.id === sessionId) : undefined;
    if (!session) {
      session = {
        id: state.nextSessionId++,
        title: content.length > 40 ? content.slice(0, 40) + "…" : content,
        created_at: nowIso(),
        messages: [],
      };
      state.sessions.unshift(session);
    }
    const userMsg: ChatMessage = {
      id: state.nextMessageId++,
      role: "user",
      content,
      created_at: nowIso(),
    };
    const assistantMsg: ChatMessage = {
      id: state.nextMessageId++,
      role: "assistant",
      content: mockAssistantReply(content, paperId),
      created_at: nowIso(),
    };
    session.messages.push(userMsg, assistantMsg);
    return {
      session_id: session.id,
      user_message: userMsg,
      assistant_message: assistantMsg,
    };
  },
  deleteSession(id: number) {
    state.sessions = state.sessions.filter((s) => s.id !== id);
  },

  listQuizzes(): QuizHistoryItem[] {
    return [...state.quizzes]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(quizToHistory);
  },
  generateQuiz(input: {
    paper_id?: number;
    topic?: string;
    num_questions: number;
    difficulty: "easy" | "medium" | "hard";
  }): Quiz {
    const picks = pickQuestions(input.num_questions);
    const quiz: StoredQuiz = {
      id: state.nextQuizId++,
      paper_id: input.paper_id ?? null,
      topic: input.topic ?? null,
      questions: picks.map(({ question, options }) => ({ question, options })),
      correct_indices: picks.map((p) => p.correct_index),
      explanations: picks.map((p) => p.explanation),
      total: picks.length,
      submitted: false,
      score: null,
      created_at: nowIso(),
    };
    state.quizzes.unshift(quiz);
    return publicQuiz(quiz);
  },
  submitQuiz(id: number, answers: number[]): QuizSubmission {
    const quiz = state.quizzes.find((q) => q.id === id);
    if (!quiz) {
      const e: any = new Error("Quiz not found");
      e.status = 404;
      e.detail = "Quiz not found";
      throw e;
    }
    const results: QuizResultItem[] = quiz.questions.map((q, i) => ({
      question: q.question,
      options: q.options,
      selected: answers[i] ?? -1,
      correct_index: quiz.correct_indices[i],
      is_correct: answers[i] === quiz.correct_indices[i],
      explanation: quiz.explanations[i],
    }));
    const correct = results.filter((r) => r.is_correct).length;
    const score = (correct / quiz.total) * 100;
    quiz.submitted = true;
    quiz.score = score;
    return { quiz_id: quiz.id, score, correct, total: quiz.total, results };
  },

  listUsers(): User[] {
    return [...state.users];
  },
  stats(): Stats {
    return {
      users: state.users.length,
      students: state.users.filter((u) => u.role === "student").length,
      papers: state.papers.length,
      quizzes: state.quizzes.filter((q) => q.submitted).length,
    };
  },
  deleteUser(id: number) {
    state.users = state.users.filter((u) => u.id !== id);
  },
};
