import { z } from "zod";

// Define types for BEM API
type CreatePipelineParams = {
  name: string;
  outputSchema: any;
};

type TransformParams = {
  pipelineID: string;
  referenceID: string;
  inputType: "text" | "pdf" | "email" | "image";
  inputContent: string;
};

// 1️⃣ Tool: createPipeline
export const bemCreatePipeline = {
  name: "bem.createPipeline",
  description:
    "Create a new bem pipeline so future raw data can be normalized into the supplied JSON schema.",
  parameters: z.object({
    name: z.string().describe("Human-readable pipeline name"),
    outputSchema: z.any().describe("Valid JSON Schema object"),
  }),
  // The function that actually hits bem:
  execute: async ({ name, outputSchema }: CreatePipelineParams) => {
    const res = await fetch("https://api.bem.ai/v1-beta/pipelines", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BEM_API_KEY}`,
      },
      body: JSON.stringify({
        name,
        outputSchemaName: name,
        outputSchema,
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    /* returns { pipelineID, inboxEmail, ... } */
    return json;
  },
};

// 2️⃣ Tool: transform
export const bemTransform = {
  name: "bem.transform",
  description:
    "Run raw text, PDFs, images, e-mails, etc. through an existing bem pipeline and get back structured JSON.",
  parameters: z.object({
    pipelineID: z.string(),
    referenceID: z.string().describe("Idempotency / tracing id"),
    inputType: z.enum(["text", "pdf", "email", "image"]),
    inputContent: z.string().describe(
      "Either raw text or base64-encoded binary"
    ),
  }),
  execute: async (args: TransformParams) => {
    const res = await fetch("https://api.bem.ai/v1-beta/transformations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BEM_API_KEY}`,
      },
      body: JSON.stringify({
        pipelineID: args.pipelineID,
        transformations: [
          {
            referenceID: args.referenceID,
            inputType: args.inputType,
            inputContent: args.inputContent,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json(); // → { transformationID, outputJson, … }
  },
}; 