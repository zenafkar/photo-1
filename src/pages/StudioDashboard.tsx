import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/clerk-react";
import { useState, useEffect } from "react";
import { useApiClient } from "../services/api";
import { Upload, Image as ImageIcon, Zap, History, Loader2, Sparkles } from "lucide-react";

export default function StudioDashboard() {
  const [credits, setCredits] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("Premium studio lighting, professional product photography");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<any[]>([]);

  const api = useApiClient();

  useEffect(() => {
    // Fetch profile and credits on mount
    let isMounted = true;
    api.getProfile()
      .then((res: any) => {
        if (isMounted) {
          setCredits(res.data.credits?.remainingCredits ?? 0);
          setGenerationHistory(res.data.generations || []);
        }
      })
      .catch((err: any) => console.error("Failed to load profile:", err));
      
    return () => { isMounted = false };
  }, []); // Remove api from deps to prevent infinite loops

  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreviewUrl(URL.createObjectURL(file));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!previewUrl || credits === 0 || !imageBase64) return;
    setIsGenerating(true);
    try {
      // Mengirimkan gambar asli (base64) ke backend, bukan mock URL
      const res = await api.generateImage({
        imageUrl: imageBase64,
        prompt: prompt,
        provider: "huggingface" // we will use fallback in backend
      });
      
      setCredits(res.data.remainingCredits);
      const matchedGeneration = {
        ...res.data.generation,
        processedUrl: previewUrl || res.data.generation.processedUrl
      };
      setGenerationHistory(prev => [matchedGeneration, ...prev]);
    } catch (error) {
      alert("Failed to generate image. " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <SignedIn>
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/favicon.png" alt="Prodify" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
                <span className="font-bold text-xl tracking-tight text-slate-800">Prodify Studio</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 bg-white border border-slate-200 p-1 pl-3 rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-400 blur-sm opacity-40 group-hover:opacity-70 transition-opacity"></div>
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500 relative z-10" />
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                      {credits !== null ? credits : <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />} 
                      <span className="text-slate-400 font-semibold hidden sm:inline">Kredit</span>
                    </span>
                  </div>
                  <div className="bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-full group-hover:bg-indigo-600 transition-colors shadow-sm">
                    Top Up
                  </div>
                </div>
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid lg:grid-cols-12 gap-8">
              
              {/* Left Column: Uploader & Settings */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Upload Zone */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-indigo-500" />
                    Upload Foto Produk
                  </h2>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${previewUrl ? 'border-indigo-300' : 'border-slate-300 group-hover:border-indigo-400 bg-slate-50'}`}>
                      {previewUrl ? (
                        <div className="relative aspect-square">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">Ganti Foto</span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-square flex flex-col items-center justify-center p-8 text-center">
                          <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                            <ImageIcon className="w-8 h-8 text-indigo-400" />
                          </div>
                          <p className="font-medium text-slate-700 mb-1">Tarik & Lepas foto ke sini</p>
                          <p className="text-sm text-slate-500 mb-4">atau klik untuk browse (Max 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Prompt Settings */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    Instruksi AI (Prompt)
                  </h2>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm font-medium text-slate-700"
                    placeholder="Contoh: Di atas meja marmer putih dengan pencahayaan studio yang dramatis..."
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={!previewUrl || isGenerating || credits === 0}
                    className="mt-4 w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...</>
                    ) : credits === 0 ? (
                      "Kredit Habis - Upgrade"
                    ) : (
                      <><Sparkles className="w-5 h-5" /> Generate Foto (-1 Kredit)</>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Gallery */}
              <div className="lg:col-span-7">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full min-h-[600px]">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" />
                    Galeri & Hasil
                  </h2>
                  
                  {generationHistory.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
                      <p className="font-medium">Belum ada hasil generate.</p>
                      <p className="text-sm">Upload foto dan klik Generate untuk mulai!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {generationHistory.map((item, idx) => (
                        <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                          {item.processedUrl ? (
                            <img 
                              src={item.processedUrl} 
                              alt="Generated Studio Result" 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1000&q=80";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50">
                               <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
                               <span className="text-xs font-medium text-indigo-600">Processing...</span>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-medium truncate">{item.preset}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
