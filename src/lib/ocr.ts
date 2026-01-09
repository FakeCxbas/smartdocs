import Tesseract from "tesseract.js";

export async function extractTextFromFile(file: File): Promise<string> {
  const { data } = await Tesseract.recognize(file, "spa", {
    logger: () => {},
  });

  return data.text;
}
