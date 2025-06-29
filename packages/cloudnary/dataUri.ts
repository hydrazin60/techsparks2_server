import path from "path";
import DataURIParser from "datauri/parser";

interface File {
  originalname: string;
  buffer: Buffer;
}

interface DataURIResult {
  content?: string;
}

const parser = new DataURIParser();

const getDataUri = (file: File | null | undefined): string | null => {
  if (!file || !file.buffer) {
    console.error("Invalid file input:", file);
    return null;
  }

  const extName = path.extname(file.originalname).toString();
  const result: DataURIResult = parser.format(extName, file.buffer);
  return result.content || null;
};

export default getDataUri;
