// FR-2: Note Upload  (Owner: Member 2)
// Route: /upload  (login required)
import { useRef, useState } from "react";
import api, { errorMessage } from "../../api/axios.js";
import MyUploads from "./MyUploads.jsx";
import "./upload.css";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB, the server checks this again
const ALLOWED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".docx", ".pptx"];

const EMPTY_FORM = { title: "", subject: "", className: "", tags: "", description: "" };

export default function UploadPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInput = useRef(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleFile(e) {
    setFile(e.target.files[0] || null);
  }

  // Quick checks before sending. The server checks everything again.
  function validate() {
    if (!form.title.trim()) return "Please enter a title";
    if (!form.subject.trim()) return "Please enter a subject";
    if (!form.description.trim()) return "Please write a short description of the note";
    if (!file) return "Please choose a file to upload";

    const name = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      return "Only PDF, image (PNG, JPG, WEBP), Word (DOCX) or PowerPoint (PPTX) files are allowed";
    }
    if (file.size > MAX_SIZE) return "File is too large. Maximum size is 10 MB";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("file", file);

    setBusy(true);
    try {
      const response = await api.post("/api/upload", data);
      setSuccess(response.data.message);
      setForm(EMPTY_FORM);
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      setRefreshKey((key) => key + 1); // reload "My uploads"
    } catch (err) {
      setError(errorMessage(err, "Upload failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="upload-page">
      <h1>Upload a note</h1>

      <div className="card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" type="text" maxLength={120} value={form.title} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              name="subject"
              type="text"
              maxLength={80}
              placeholder="For example: Data Structures"
              value={form.subject}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="className">Class (optional)</label>
            <input
              id="className"
              name="className"
              type="text"
              maxLength={80}
              placeholder="For example: Batch 62, Section A"
              value={form.className}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags (optional)</label>
            <input
              id="tags"
              name="tags"
              type="text"
              placeholder="Separate with commas: arrays, sorting, midterm"
              value={form.tags}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Short description</label>
            <textarea
              id="description"
              name="description"
              maxLength={500}
              placeholder="What is in this note? Anyone can read this without downloading the file."
              value={form.description}
              onChange={handleChange}
            />
            <span className="form-hint">{form.description.length}/500 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="file">File</label>
            <input
              id="file"
              ref={fileInput}
              type="file"
              accept={ALLOWED_EXTENSIONS.join(",")}
              onChange={handleFile}
            />
            <span className="form-hint">PDF, image (PNG, JPG, WEBP), Word (DOCX) or PowerPoint (PPTX). Up to 10 MB.</span>
          </div>

          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Uploading..." : "Upload note"}
          </button>
        </form>
      </div>

      <MyUploads refreshKey={refreshKey} />
    </div>
  );
}
