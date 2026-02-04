"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Download, Share2, Sparkles, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function ShareResultCard({ result, testTitle }: { result: any, testTitle: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    generateShareImage();
  }, [result, testTitle]);

  async function generateShareImage() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = 1200;
    canvas.height = 630;
    
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#0A0A0A');
    gradient.addColorStop(1, '#1A1A1A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);
    
    // Decor
    ctx.fillStyle = '#74b602';
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    ctx.arc(1100, 100, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Logo Text
    ctx.fillStyle = '#74b602';
    ctx.font = 'black 40px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('IELTS PRACTICE BD', 60, 80);
    
    // Band Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 180px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(result.overall_band?.toFixed(1) || "0.0", 600, 320);
    
    ctx.fillStyle = '#74b602';
    ctx.font = 'bold 40px Arial';
    ctx.fillText('OVERALL BAND SCORE', 600, 380);
    
    // Test Name
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 32px Arial';
    ctx.fillText(testTitle, 600, 460);
    
    // URL
    ctx.fillStyle = '#74b602';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('www.orchids.com.bd', 600, 550);
    
    setImageUrl(canvas.toDataURL('image/png'));
  }

  async function shareToSocial(platform: string) {
    const url = window.location.origin;
    const text = `আমি Orchids IELTS Mock Test এ Band ${result.overall_band?.toFixed(1)} পেয়েছি! 🎉 আপনিও ট্রাই করুন 👉`;
    
    if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'width=600,height=400');
    } else if (platform === 'download' && imageUrl) {
      const link = document.createElement('a');
      link.download = `orchids-ielts-result.png`;
      link.href = imageUrl;
      link.click();
    }
    
    // Log activity
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_activities').insert({
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
        activity_type: `shared_result_${platform}`,
        test_name: testTitle,
        created_at: new Date().toISOString()
      });
    }
  }

  return (
    <div className="space-y-8 font-hind-siliguri">
      <div className="relative group aspect-[1200/630] rounded-[2.5rem] overflow-hidden border-4 border-primary/20 shadow-2xl bg-black">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <p className="text-white font-black text-xl flex items-center gap-3">
            <Sparkles className="text-primary animate-pulse" />
            আপনার সাফল্য শেয়ার করুন!
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button 
          onClick={() => shareToSocial('facebook')}
          className="h-16 font-black rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] text-white shadow-xl shadow-blue-500/20"
        >
          <Facebook className="mr-2 h-5 w-5" />
          Facebook
        </Button>
        <Button 
          onClick={() => shareToSocial('twitter')}
          className="h-16 font-black rounded-2xl bg-[#1DA1F2] hover:bg-[#1A8CD8] text-white shadow-xl shadow-sky-500/20"
        >
          <Twitter className="mr-2 h-5 w-5" />
          Twitter
        </Button>
        <Button 
          onClick={() => shareToSocial('download')}
          variant="outline"
          className="h-16 font-black rounded-2xl border-2 border-primary/20 hover:bg-primary/5"
        >
          <Download className="mr-2 h-5 w-5" />
          Download
        </Button>
      </div>
    </div>
  );
}
