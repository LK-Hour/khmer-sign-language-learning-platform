"use client";

import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import Close from "@mui/icons-material/Close";
import Edit from "@mui/icons-material/Edit";
import ErrorOutline from "@mui/icons-material/ErrorOutlineOutlined";
import FormatListNumbered from "@mui/icons-material/FormatListNumbered";
import ImageIcon from "@mui/icons-material/Image";
import Layers from "@mui/icons-material/Layers";
import MenuBook from "@mui/icons-material/MenuBook";
import TextFields from "@mui/icons-material/TextFields";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useMemo, useState } from "react";
import { INITIAL_QUESTIONS, MOCK_CONTEXT } from "./mockData";
import type { AdminQuizQuestion, AdminQuizQuestionType } from "./types";

function typeBadgeClasses(type: AdminQuizQuestionType): string {
  if (type === "MULTIPLE_CHOICE") {
    return "bg-indigo-50 text-indigo-600";
  }
  if (type === "IMAGE_CHOICE") {
    return "bg-amber-50 text-amber-600";
  }
  return "bg-emerald-50 text-emerald-600";
}

function typeLabel(type: AdminQuizQuestionType): string {
  if (type === "MULTIPLE_CHOICE") return "Multiple Choice";
  if (type === "IMAGE_CHOICE") return "Image Selection";
  return "Text Input";
}

const TYPE_OPTIONS: AdminQuizQuestionType[] = [
  "MULTIPLE_CHOICE",
  "IMAGE_CHOICE",
  "TEXT_INPUT",
];

export default function AdminQuizManager() {
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>(
    () => INITIAL_QUESTIONS,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<AdminQuizQuestion>(() => ({
    id: "",
    chapter_id: MOCK_CONTEXT.chapter.id,
    lesson_id: MOCK_CONTEXT.lessons[0]?.id ?? null,
    type: "MULTIPLE_CHOICE",
    prompt: "",
    prompt_kh: "",
    image_url: "",
    options: ["", "", "", ""],
    correct_answer: "",
    order_index: 1,
    is_active: true,
  }));

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order_index - b.order_index),
    [questions],
  );

  const handleTypeChange = (newType: AdminQuizQuestionType) => {
    let newOptions: string[] = [];
    const newCorrectAnswer = "";

    if (newType === "MULTIPLE_CHOICE") {
      newOptions = ["", "", "", ""];
    } else if (newType === "IMAGE_CHOICE") {
      newOptions = ["", ""];
    } else {
      newOptions = [];
    }

    setFormData((prev) => ({
      ...prev,
      type: newType,
      options: newOptions,
      correct_answer: newCorrectAnswer,
      image_url: newType === "IMAGE_CHOICE" ? "" : prev.image_url,
    }));
  };

  const openCreateModal = () => {
    setFormData({
      id: "",
      chapter_id: MOCK_CONTEXT.chapter.id,
      lesson_id: MOCK_CONTEXT.lessons[0]?.id ?? null,
      type: "MULTIPLE_CHOICE",
      prompt: "",
      prompt_kh: "",
      image_url: "",
      options: ["", "", "", ""],
      correct_answer: "",
      order_index: questions.length + 1,
      is_active: true,
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (question: AdminQuizQuestion) => {
    setFormData({ ...question });
    setEditingId(question.id);
    setIsModalOpen(true);
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, is_active: !currentStatus } : q,
      ),
    );
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = value;
      let newCorrectAnswer = prev.correct_answer;
      if (prev.correct_answer === prev.options[index]) {
        newCorrectAnswer = value;
      }
      return { ...prev, options: newOptions, correct_answer: newCorrectAnswer };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type !== "TEXT_INPUT") {
      if (
        !formData.correct_answer ||
        !formData.options.includes(formData.correct_answer)
      ) {
        window.alert("Please select or define a valid correct answer.");
        return;
      }
    } else {
      if (!formData.correct_answer.trim()) {
        window.alert("Please enter the correct answer text.");
        return;
      }
    }

    if (editingId) {
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingId ? { ...formData, id: editingId } : q,
        ),
      );
    } else {
      setQuestions((prev) => [
        ...prev,
        { ...formData, id: `q${Date.now()}` },
      ]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 text-slate-300 md:flex">
        <div className="flex items-center space-x-2 border-b border-slate-800 bg-slate-950 p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold text-white">
            K
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none tracking-wide text-white">
              KSL Admin
            </h1>
            <p className="mt-1 text-[10px] uppercase text-slate-500">
              Management
            </p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Navigation
          </div>
          <a
            href="#"
            className="flex items-center space-x-3 rounded-lg border border-blue-600/20 bg-blue-600/10 p-2.5 text-blue-400"
          >
            <Layers sx={{ fontSize: 18 }} />
            <span className="font-medium">Curriculum</span>
          </a>
          <a
            href="#"
            className="group flex items-center space-x-3 rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-slate-800"
          >
            <MenuBook
              sx={{ fontSize: 18 }}
              className="group-hover:text-white"
            />
            <span className="group-hover:text-white">Exercises</span>
          </a>
        </nav>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 border-b border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-slate-400">
            <span>{MOCK_CONTEXT.track}</span>
            <span className="text-slate-300">/</span>
            <span>{MOCK_CONTEXT.unit.title}</span>
            <span className="text-slate-300">/</span>
            <span>{MOCK_CONTEXT.chapter.title}</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <h2 className="flex items-center space-x-2 text-xl font-bold text-slate-800">
              <FormatListNumbered sx={{ fontSize: 24 }} className="text-blue-600" />
              <span>Quiz Management</span>
            </h2>
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95"
            >
              <Add sx={{ fontSize: 18 }} />
              <span className="text-sm font-semibold">Add Question</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <th className="w-16 p-4 text-center font-bold">Ord</th>
                  <th className="p-4 font-bold">Content Preview</th>
                  <th className="p-4 font-bold">Type</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedQuestions.map((q) => (
                  <tr
                    key={q.id}
                    className={`group transition-colors hover:bg-slate-50/50 ${!q.is_active ? "opacity-50" : ""}`}
                  >
                    <td className="p-4 text-center font-mono text-xs text-slate-400">
                      {q.order_index}
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-semibold text-slate-800">
                        {q.prompt}
                      </div>
                      <div className="mt-0.5 text-xs italic text-slate-500">
                        {q.correct_answer && q.type === "TEXT_INPUT"
                          ? `Answer: ${q.correct_answer}`
                          : q.prompt_kh}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter ${typeBadgeClasses(q.type)}`}
                      >
                        {typeLabel(q.type)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center space-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${q.is_active ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${q.is_active ? "bg-green-500" : "bg-slate-400"}`}
                        />
                        <span>{q.is_active ? "Active" : "Inactive"}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openEditModal(q)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit sx={{ fontSize: 16 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(q.id, q.is_active)}
                          className={`rounded-lg p-2 transition-colors ${q.is_active ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-400 hover:bg-green-50 hover:text-green-600"}`}
                        >
                          {q.is_active ? (
                            <VisibilityOff sx={{ fontSize: 16 }} />
                          ) : (
                            <Visibility sx={{ fontSize: 16 }} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingId ? "Edit Question" : "Add New Question"}
                </h3>
                <p className="text-xs font-bold uppercase tracking-tighter text-slate-500">
                  {formData.type} Interaction Mode
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <Close sx={{ fontSize: 20 }} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30 p-6">
              <form id="quizForm" onSubmit={handleSave} className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <label className="mb-3 block text-center text-[11px] font-bold uppercase text-slate-500">
                    Select Quiz Interaction Type
                  </label>
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {TYPE_OPTIONS.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${formData.type === type ? "scale-105 bg-white text-blue-600 shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                      >
                        {typeLabel(type)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center space-x-2 text-slate-400">
                    <TextFields sx={{ fontSize: 16 }} />
                    <span className="text-xs font-bold uppercase tracking-tight">
                      Question Title / Prompt
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="ml-1 text-[10px] font-bold uppercase text-slate-400">
                        Title (EN) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.prompt}
                        onChange={(e) =>
                          setFormData({ ...formData, prompt: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="Enter the question text"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-[10px] font-bold uppercase text-slate-400">
                        Title (KH)
                      </label>
                      <input
                        type="text"
                        value={formData.prompt_kh}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            prompt_kh: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-sm outline-none focus:border-blue-500"
                        placeholder="បញ្ចូលចំណងជើងជាភាសាខ្មែរ"
                      />
                    </div>
                  </div>
                </div>

                {(formData.type === "MULTIPLE_CHOICE" ||
                  formData.type === "TEXT_INPUT") && (
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-2 flex items-center space-x-2 text-slate-400">
                      <ImageIcon sx={{ fontSize: 16 }} />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        Question Visual Content
                      </span>
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-[10px] font-bold uppercase text-slate-400">
                        Question Image URL *
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="relative flex-1">
                          <input
                            type="url"
                            required
                            value={formData.image_url}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                image_url: e.target.value,
                              })
                            }
                            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 pl-10 text-sm outline-none focus:border-blue-500"
                            placeholder="https://example.com/image.png"
                          />
                          <ImageIcon
                            sx={{
                              fontSize: 18,
                              position: "absolute",
                              left: 12,
                              top: 12,
                              color: "rgb(203 213 225)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>
                        {formData.image_url ? (
                          <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formData.image_url}
                              className="h-full w-full object-cover"
                              alt=""
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-2 flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Check sx={{ fontSize: 18 }} />
                      <span className="text-xs font-bold uppercase tracking-tight">
                        Answer Configuration
                      </span>
                    </div>
                    {formData.type !== "TEXT_INPUT" && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">
                        Choose correct option
                      </span>
                    )}
                  </div>

                  {formData.type === "MULTIPLE_CHOICE" && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {formData.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center space-x-3 rounded-xl border p-3 transition-all ${formData.correct_answer === opt && opt !== "" ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100" : "border-slate-100 bg-slate-50/30"}`}
                        >
                          <input
                            type="radio"
                            name="correct_answer"
                            required
                            checked={
                              formData.correct_answer === opt && opt !== ""
                            }
                            onChange={() =>
                              setFormData({
                                ...formData,
                                correct_answer: opt,
                              })
                            }
                            className="h-4 w-4 text-blue-600"
                          />
                          <input
                            type="text"
                            required
                            placeholder={`Choice ${idx + 1}`}
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                            className="flex-1 border-none bg-transparent p-0 text-sm font-medium outline-none placeholder:text-slate-300 focus:ring-0"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.type === "IMAGE_CHOICE" && (
                    <div className="grid grid-cols-1 gap-4">
                      {formData.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`rounded-xl border p-4 transition-all ${formData.correct_answer === opt && opt !== "" ? "border-blue-200 bg-blue-50/50 ring-1 ring-blue-100" : "border-slate-100 bg-slate-50/30"}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-2">
                              <label className="mb-1 text-[8px] font-bold uppercase text-slate-400">
                                Correct?
                              </label>
                              <input
                                type="radio"
                                name="correct_answer"
                                required
                                checked={
                                  formData.correct_answer === opt &&
                                  opt !== ""
                                }
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    correct_answer: opt,
                                  })
                                }
                                className="h-5 w-5 text-blue-600"
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-bold uppercase text-slate-500">
                                Option Image URL {idx + 1} *
                              </label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="url"
                                  required
                                  placeholder="Enter image URL..."
                                  value={opt}
                                  onChange={(e) =>
                                    handleOptionChange(idx, e.target.value)
                                  }
                                  className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-sm outline-none focus:border-blue-500"
                                />
                                <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                  {opt ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={opt}
                                      className="h-full w-full object-cover"
                                      alt=""
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-200">
                                      <ImageIcon sx={{ fontSize: 14 }} />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.type === "TEXT_INPUT" && (
                    <div className="space-y-3">
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4">
                        <label className="mb-2 block text-[10px] font-bold uppercase text-emerald-700">
                          Target Correct Answer Text *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.correct_answer}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              correct_answer: e.target.value,
                            })
                          }
                          placeholder="What is the exact text the user should type?"
                          className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-sm shadow-sm outline-none focus:border-emerald-500"
                        />
                        <p className="mt-2 text-[9px] font-medium italic text-emerald-600">
                          Note: System will compare user input with this value
                          for scoring.
                        </p>
                      </div>
                    </div>
                  )}

                  {!formData.correct_answer && (
                    <p className="flex items-center rounded-lg border border-amber-100 bg-amber-50 p-2.5 text-[10px] text-amber-600">
                      <ErrorOutline
                        sx={{ fontSize: 14 }}
                        className="mr-2 flex-shrink-0"
                      />
                      Validation: A correct answer must be specified to save
                      this question.
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 md:flex-row md:items-center">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-0"
                    />
                    <label
                      htmlFor="isActive"
                      className="cursor-pointer text-sm font-bold text-slate-600"
                    >
                      Published & Active
                    </label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.order_index}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order_index: Number.parseInt(e.target.value, 10) || 1,
                        })
                      }
                      className="w-16 rounded-lg border border-slate-200 bg-slate-50 p-2 text-center font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end space-x-3 border-t border-slate-100 bg-white px-6 py-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl bg-slate-50 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="quizForm"
                className="flex items-center space-x-2 rounded-xl bg-blue-600 px-8 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
              >
                <Check sx={{ fontSize: 16 }} />
                <span>{editingId ? "Update Question" : "Add Question"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
