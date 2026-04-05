import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  });

const todoSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

todoSchema.set("toJSON", {
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const Todo = mongoose.model("Todo", todoSchema);

app.get("/todos", async (req, res) => {
  try {
    const todos = await Todo.find().sort({ completed: 1, createdAt: -1 });
    res.status(200).json(todos);
  } catch (error) {
    res.status(500).json({ message: "할 일 목록 조회 실패" });
  }
});

app.post("/todos", async (req, res) => {
  try {
    const content = String(req.body.content ?? "").trim();

    if (!content) {
      return res.status(400).json({ message: "content는 필수입니다." });
    }

    const todo = await Todo.create({
      content,
      completed: false,
    });

    res.status(201).json(todo);
  } catch (error) {
    res.status(500).json({ message: "할 일 추가 실패" });
  }
});

app.put("/todos/:id", async (req, res) => {
  try {
    const content = String(req.body.content ?? "").trim();
    const completed = Boolean(req.body.completed);

    if (!content) {
      return res.status(400).json({ message: "content는 필수입니다." });
    }

    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { content, completed },
      { new: true, runValidators: true }
    );

    if (!updatedTodo) {
      return res.status(404).json({ message: "대상을 찾을 수 없습니다." });
    }

    res.status(200).json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: "할 일 수정 실패" });
  }
});

app.delete("/todos/:id", async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);

    if (!deletedTodo) {
      return res.status(404).json({ message: "대상을 찾을 수 없습니다." });
    }

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: "할 일 삭제 실패" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});