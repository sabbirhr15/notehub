// Stores uploaded note files inside MongoDB (GridFS), so no separate file hosting is needed.
const mongoose = require("mongoose");
const { Readable } = require("stream");

function getBucket() {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("Database is not connected");
  }
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: "notefiles" });
}

// Save a file buffer (from multer memory storage). Resolves with the GridFS file id.
function saveFile(buffer, filename, mimeType) {
  return new Promise((resolve, reject) => {
    const upload = getBucket().openUploadStream(filename, { contentType: mimeType });
    Readable.from(buffer)
      .pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve(upload.id));
  });
}

// Returns { length } for a stored file, or null if it does not exist.
async function getFileInfo(fileId) {
  const files = await getBucket()
    .find({ _id: new mongoose.Types.ObjectId(fileId) })
    .limit(1)
    .toArray();
  return files.length ? { length: files[0].length } : null;
}

// Returns a readable stream for a stored file.
function openFileStream(fileId) {
  return getBucket().openDownloadStream(new mongoose.Types.ObjectId(fileId));
}

async function deleteFile(fileId) {
  await getBucket().delete(new mongoose.Types.ObjectId(fileId));
}

module.exports = { saveFile, getFileInfo, openFileStream, deleteFile };
