import { NextRequest, NextResponse } from "next/server";

// type GenerationResponse = {
//   success: boolean;
//   image?: string;
//   error?: string;
//   prompt?: string;
// };

// type ValidStyle = "manga" | "anime" | "cyberpunk";

interface StyleTemplate {
  base: string;
  negative: string;
}

interface StyleTemplates {
  [key: string]: StyleTemplate;
}

interface RequestBody {
  style: string;
  prompt: string;
}

const STYLE_PROMPTS: StyleTemplates = {
  manga: {
    base: "manga style, detailed ink lines, classic Japanese manga, {}, monochrome shading, panel layout",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, western style",
  },
  anime: {
    base: "anime style, vibrant colors, cel shaded, {}, detailed lighting, clean lines",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, realistic, photographic",
  },
  cyberpunk: {
    base: "cyberpunk style, neon lights, high tech, {}, rain-slicked streets, holographic displays",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, historical, natural, rural",
  },
  ancient: {
    base: "ancient art style, weathered texture, historical accuracy, {}, aged parchment effect, traditional techniques, <lora:ancientArt_v1:0.7>",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, modern, futuristic, digital",
  },
  cardboard: {
    base: "cardboard art style, craft material texture, DIY aesthetic, {}, visible corrugated patterns, handmade look, matte finish",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, realistic, smooth, glossy",
  },
  Comic: {
    base: "comic book art style, bold outlines, dynamic composition, {}, dramatic lighting, halftone dots, <lora:comicBook_v1:0.6>, saturated colors",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, realistic, manga style",
  },
  Realism: {
    base: "photorealistic, highly detailed, professional photography, {}, natural lighting, 8k uhd, detailed textures, hyperrealistic",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, anime, cartoon, drawing",
  },
};

export async function POST(req: NextRequest) {
  const body: RequestBody = await req.json();
  const { style, prompt } = body;
  if (req.method !== "POST") {
    return NextResponse.json(
      {
        success: false,
        error: "Method Not Allowed",
      },
      { status: 405 }
    );
  }
  const HF_API_TOKEN = process.env.HF_TOKEN;
  const HF_MODEL = "stabilityai/stable-diffusion-3.5-large";

  if (!HF_API_TOKEN) {
    return NextResponse.json(
      {
        success: false,
        error: "Server misconfiguration: Missing API token",
      },
      { status: 400 }
    );
  }

  try {
    if (!style || !prompt) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing style or prompt",
        },
        { status: 400 }
      );
    }

    if (!(style in STYLE_PROMPTS)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid style selected",
        },
        { status: 400 }
      );
    }

    const styleTemplate = STYLE_PROMPTS[style];
    const formattedPrompt = styleTemplate.base.replace("{}", prompt);
    const negativePrompt = styleTemplate.negative;
    console.log(style,prompt)
    const hfResponse = await fetch(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: formattedPrompt,
          parameters: {
            negative_prompt: negativePrompt,
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
          options: {
            wait_for_model: true,
            use_cache: true,
          },
        }),
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      throw new Error(`Hugging Face API error: ${errorText}`);
    }
    
    const contentType = hfResponse.headers.get("content-type") || "";
    if (!contentType.includes("image")) {
      const jsonResponse = await hfResponse.json();
      throw new Error(
        `Unexpected API response: ${JSON.stringify(jsonResponse)}`
      );
    }

    const imageBuffer = await hfResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    console.log(imageBase64)
    return NextResponse.json(
      {
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
        prompt: formattedPrompt,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Generation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
