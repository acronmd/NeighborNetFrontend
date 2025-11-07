// app/data/demoData.js
export const users = [
  {
    id: 1,
    name: "Jonathan",
    username: "jonathan",
    bio: "Curious developer exploring mobile-first design.",
    age: 22,
    occupation: "Student",
    interests: ["UI/UX", "React Native", "Facial Recognition"],
    skills: ["JavaScript", "React Native", "Design Thinking"],
  },
  {
    id: 2,
    name: "Ava",
    username: "ava_dev",
    bio: "Engineer passionate about clean code and community tools.",
    age: 27,
    occupation: "Engineer",
    interests: ["Open Source", "TypeScript", "Community Building"],
    skills: ["TypeScript", "Node.js", "Git"],
  },
];



export const posts = [
  {
    id: "p1",
    authorId: 1,
    title: "Facial Recognition for Home Security",
    body: "Exploring how biometric tech can improve safety and convenience.",
    time: "2h",
    likes: 12,
    comments: [
      { id: "c1", author: "ava_dev", text: "Love this idea!" },
      { id: "c2", author: "jonathan", text: "Thanks Ava!" },
    ],
  },
  {
    id: "p2",
    authorId: 2,
    title: "Why I Love TypeScript",
    body: "Type safety saves lives (and hours of debugging).",
    time: "8h",
    likes: 4,
    comments: [
      { id: "c3", author: "jonathan", text: "Totally agree!" },
    ],
  },
];