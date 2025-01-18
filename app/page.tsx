"use client";
import { useState } from "react";
import { Loader2, Download, RefreshCw } from "lucide-react";

type StyleTemplate = {
  base: string;
  negative: string;
  description: string;
};
type StyleTemplates = {
  [key: string]: StyleTemplate;
};

const STYLE_PROMPTS: StyleTemplates = {
  manga: {
    base: "manga style, detailed ink lines, classic Japanese manga, {}, monochrome shading, panel layout, <lora:AnimeLineart_v1:0.8>, sharp contrast",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, western style",
    description:
      "Classic Japanese manga style with clean lines and dramatic shading",
  },
  anime: {
    base: "anime style, vibrant colors, cel shaded, {}, detailed lighting, clean lines, <lora:animeStyle_v2:0.7>, high detail",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, realistic, photographic",
    description: "Vibrant anime style with cel shading and clean lines",
  },
  cyberpunk: {
    base: "cyberpunk style, neon lights, high tech, {}, rain-slicked streets, holographic displays, <lora:cyberpunkStyle_v2:0.8>, chromatic aberration",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, historical, natural, rural",
    description: "Futuristic cyberpunk aesthetic with neon and tech elements",
  },
  ancient: {
    base: "ancient art style, weathered texture, historical accuracy, {}, aged parchment effect, traditional techniques, <lora:ancientArt_v1:0.7>",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, modern, futuristic, digital",
    description: "Traditional ancient art style with historical elements",
  },
  cardboard: {
    base: "cardboard art style, craft material texture, DIY aesthetic, {}, visible corrugated patterns, handmade look, matte finish",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, realistic, smooth, glossy",
    description: "Creative cardboard art style with handcrafted feel",
  },
  Comic: {
    base: "comic book art style, bold outlines, dynamic composition, {}, dramatic lighting, halftone dots, <lora:comicBook_v1:0.6>, saturated colors",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, realistic, manga style",
    description: "Creative Comic Style Designs",
  },
  Realism: {
    base: "photorealistic, highly detailed, professional photography, {}, natural lighting, 8k uhd, detailed textures, hyperrealistic",
    negative:
      "ugly, deformed, noisy, blurry, low quality, pixelated, anime, cartoon, drawing",
    description: "A realistic style for visualizing scenes.",
  },
};

const Home = () => {
  const [selectedStyle, setSelectedStyle] = useState<string>("manga");
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string>("");

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    setError("");

    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        console.log(
          `Attempt ${attempt}: Generating image in ${selectedStyle} style...`
        );

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style: selectedStyle, prompt }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image");
        }

        setGeneratedImage(data.image);
        setLoading(false)
        return; // Exit loop if successful
      } catch (err) {
        if (attempt === 5) {
          setLoading(false)
          setError(err instanceof Error ? err.message : "An error occurred");
        } else {
          console.warn(`Retrying in 5 seconds...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    setLoading(false);
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = `generated-${selectedStyle}-${Date.now()}.png`;
      link.click();
    }
  };

  return (
    <div className="w-screen h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-50 mb-2">
            SceneForge AI
          </h1>
          <p className="text-stone-400">
            Select a style and describe the scene you want to visualize
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Style Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Select Style
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-600 text-slate-50"
              >
                {Object.entries(STYLE_PROMPTS).map(([key, value]) => (
                  <option key={key} value={key} className="text-slate-50">
                    {key.charAt(0).toUpperCase() + key.slice(1)} -{" "}
                    {value.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-400">
                Description
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-32 bg-slate-600 text-slate-50"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateImage}
              disabled={loading}
              className="w-full bg-red-700 text-white px-6 py-3 rounded-lg hover:bg-red-400 
                        transition-colors disabled:bg-red-300 disabled:cursor-not-allowed
                        flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw />
                  <span>Generate Image</span>
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Result Section */}
          <div className="space-y-6">
            {generatedImage ? (
              <div className="space-y-4">
                <div className="relative group">
                  <img
                    src={generatedImage}
                    alt="Generated artwork"
                    className="w-full rounded-lg shadow-lg"
                  />
                  <button
                    onClick={handleDownload}
                    className="absolute top-2 right-2 bg-white/90 p-2 rounded-full shadow-lg
                              opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center border-2 border-dashed rounded-lg p-12">
                <p className="text-gray-500 text-center">
                  Generated image will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
