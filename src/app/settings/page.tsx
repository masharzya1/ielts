"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Settings as SettingsIcon, 
  Lock, 
  Target, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Phone,
  BookOpen,
  Calendar,
  GraduationCap,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Camera,
  Upload
} from "lucide-react";
import { toast } from "sonner";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    full_name: "",
    phone: "",
    target_score: "",
    test_type: "",
    current_level: "",
    exam_date: "",
    institution: "",
    address: "",
    avatar_url: "",
  });

  const [passwords, setPasswords] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            phone: profileData.phone || "",
            target_score: profileData.target_score || "",
            test_type: profileData.test_type || "",
            current_level: profileData.current_level || "",
            exam_date: profileData.exam_date || "",
            institution: profileData.institution || "",
            address: profileData.address || "",
            avatar_url: profileData.avatar_url || "",
          });
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "storage_settings")
        .maybeSingle();
      
      const imgbbKey = settingsData?.value?.imgbb_api_key;
      if (!imgbbKey) {
        toast.error("ImgBB API key is not configured in Admin Settings.");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        const url = data.data.url;
        setProfile({ ...profile, avatar_url: url });
        
        // Update profile in DB immediately
        await supabase
          .from("profiles")
          .update({ avatar_url: url })
          .eq("id", user.id);
          
        toast.success("প্রোফাইল ফটো আপডেট হয়েছে");
      } else {
        throw new Error(data.error?.message || "Upload failed");
      }
    } catch (err: any) {
      toast.error("ছবি আপলোড করতে সমস্যা হয়েছে: " + err.message);
    }
    setUploading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        target_score: profile.target_score,
        test_type: profile.test_type,
        current_level: profile.current_level,
        exam_date: profile.exam_date || null,
        institution: profile.institution,
        address: profile.address,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (error) {
      toast.error("প্রোফাইল আপডেট করতে সমস্যা হয়েছে: " + error.message);
    } else {
      toast.success("প্রোফাইল সফলভাবে আপডেট করা হয়েছে");
    }
    setSaving(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("পাসওয়ার্ড দুটি মিলছে না");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword,
    });

    if (error) {
      toast.error("পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে: " + error.message);
    } else {
      toast.success("পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে");
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-24 px-4 font-hind-siliguri">
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <SettingsIcon className="h-10 w-10 text-primary" />
            সেটিংস
          </h1>
          <p className="text-muted-foreground font-medium mt-2">আপনার প্রোফাইল এবং অ্যাকাউন্ট ম্যানেজ করুন।</p>
        </div>
        
        <div className="flex items-center gap-6 p-4 rounded-3xl bg-secondary/30 border border-border/50 backdrop-blur-sm">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
              <AvatarImage src={profile.avatar_url} className="object-cover" />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">
                {profile.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-black flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <Camera className="h-4 w-4" />
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <h3 className="font-black text-lg leading-none mb-1">{profile.full_name || "নতুন শিক্ষার্থী"}</h3>
            <p className="text-xs font-bold text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px] h-14 bg-secondary/50 p-1.5 rounded-2xl border border-border/30">
          <TabsTrigger value="profile" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg h-full transition-all">প্রোফাইল</TabsTrigger>
          <TabsTrigger value="goals" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg h-full transition-all">আইইএলটিএস</TabsTrigger>
          <TabsTrigger value="account" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg h-full transition-all">নিরাপত্তা</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-8 border-b border-border/30 bg-secondary/10">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                ব্যক্তিগত তথ্য
              </CardTitle>
              <CardDescription className="font-medium">আপনার সাধারণ তথ্য এখানে আপডেট করুন।</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="full_name" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">পূর্ণ নাম</Label>
                    <Input 
                      id="full_name" 
                      value={profile.full_name}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      placeholder="আপনার নাম লিখুন"
                      className="rounded-2xl h-12 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="phone" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">ফোন নম্বর</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        placeholder="+৮৮০ ১XXX XXXXXX"
                        className="rounded-2xl h-12 pl-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="institution" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">শিক্ষা প্রতিষ্ঠান / কর্মস্থল</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="institution" 
                        value={profile.institution}
                        onChange={(e) => setProfile({...profile, institution: e.target.value})}
                        placeholder="আপনার প্রতিষ্ঠানের নাম"
                        className="rounded-2xl h-12 pl-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="address" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">বর্তমান ঠিকানা</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="address" 
                        value={profile.address}
                        onChange={(e) => setProfile({...profile, address: e.target.value})}
                        placeholder="আপনার ঠিকানা লিখুন"
                        className="rounded-2xl h-12 pl-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="rounded-2xl font-black px-10 h-13 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    তথ্য আপডেট করুন
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-8 border-b border-border/30 bg-secondary/10">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                আইইএলটিএস লক্ষ্য
              </CardTitle>
              <CardDescription className="font-medium">আপনার টার্গেট স্কোর এবং প্রস্তুতির ধরন নির্ধারণ করুন।</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                      টার্গেট ব্যান্ড স্কোর
                    </Label>
                    <Select value={profile.target_score} onValueChange={(v) => setProfile({...profile, target_score: v})}>
                      <SelectTrigger className="h-12 rounded-2xl bg-background/50 border-border/50">
                        <SelectValue placeholder="সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        {["5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0"].map((s) => (
                          <SelectItem key={s} value={s} className="font-bold">ব্যান্ড {s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                      টেস্ট টাইপ
                    </Label>
                    <Select value={profile.test_type} onValueChange={(v) => setProfile({...profile, test_type: v})}>
                      <SelectTrigger className="h-12 rounded-2xl bg-background/50 border-border/50">
                        <SelectValue placeholder="সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Academic" className="font-bold">Academic</SelectItem>
                        <SelectItem value="General Training" className="font-bold">General Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                      বর্তমান ইংলিশ লেভেল
                    </Label>
                    <Select value={profile.current_level} onValueChange={(v) => setProfile({...profile, current_level: v})}>
                      <SelectTrigger className="h-12 rounded-2xl bg-background/50 border-border/50">
                        <SelectValue placeholder="সিলেক্ট করুন" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner" className="font-bold">Beginner</SelectItem>
                        <SelectItem value="Intermediate" className="font-bold">Intermediate</SelectItem>
                        <SelectItem value="Upper Intermediate" className="font-bold">Upper Intermediate</SelectItem>
                        <SelectItem value="Advanced" className="font-bold">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1 flex items-center gap-2">
                      টার্গেট এক্সাম ডেট
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        value={profile.exam_date}
                        onChange={(e) => setProfile({...profile, exam_date: e.target.value})}
                        className="h-12 pl-11 rounded-2xl bg-background/50 border-border/50"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="rounded-2xl font-black px-10 h-13 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-black hover:bg-primary/90">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                    লক্ষ্য আপডেট করুন
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-border/50 shadow-2xl rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-8 border-b border-border/30 bg-secondary/10">
              <CardTitle className="text-xl font-black flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                নিরাপত্তা ও পাসওয়ার্ড
              </CardTitle>
              <CardDescription className="font-medium">আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে পাসওয়ার্ড আপডেট করুন।</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleUpdatePassword} className="space-y-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="new_password" title="পাসওয়ার্ড অবশ্যই ৬ অক্ষরের বেশি হতে হবে" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">নতুন পাসওয়ার্ড</Label>
                    <div className="relative">
                      <Input 
                        id="new_password" 
                        type={showNewPassword ? "text" : "password"}
                        value={passwords.newPassword}
                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                        className="rounded-2xl h-12 pr-12 bg-background/50 border-border/50"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="confirm_password" className="font-black text-xs uppercase tracking-widest text-muted-foreground pl-1">পাসওয়ার্ড নিশ্চিত করুন</Label>
                    <div className="relative">
                      <Input 
                        id="confirm_password" 
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwords.confirmPassword}
                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                        className="rounded-2xl h-12 pr-12 bg-background/50 border-border/50"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="rounded-2xl font-black px-10 h-13 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                    পাসওয়ার্ড পরিবর্তন করুন
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
