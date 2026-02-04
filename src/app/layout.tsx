import './globals.css';
import { ReactNode } from 'react';
import Script from 'next/script';
import { Hind_Siliguri, Outfit, Bricolage_Grotesque } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Navbar } from '@/components/Navbar';
import { Toaster } from 'sonner';
import UserTracker from '@/components/UserTracker';

const hindSiliguri = Hind_Siliguri({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind-siliguri',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
});

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'IELTS Practice BD - বাংলাদেশের ১ নম্বর আইইএলটিএস প্ল্যাটফর্ম',
  description: 'প্র্যাকটিস, লাইভ মক, ভোকাব ও এআই রাইটিং—সব এক প্ল্যাটফর্মে। IELTS প্রস্তুতির জন্য বাংলাদেশের সেরা অনলাইন প্ল্যাটফর্ম।',
  keywords: 'IELTS, IELTS Practice, Mock Test, AI Writing Evaluation, Vocabulary, Bangladesh IELTS',
  openGraph: {
    title: 'IELTS Practice BD',
    description: 'আপনার বিদেশের স্বপ্ন এখন হাতের মুঠোয়।',
    type: 'website',
    locale: 'bn_BD',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IELTS Practice BD',
    description: 'IELTS প্রস্তুতির পূর্ণাঙ্গ সলিউশন।',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="en" suppressHydrationWarning className={`${outfit.variable} ${bricolage.variable} ${hindSiliguri.variable}`}>
        <body className="font-outfit antialiased" suppressHydrationWarning>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <Navbar />
              <UserTracker />
              {children}
              <Toaster richColors position="top-center" />
            </ThemeProvider>
          <Script id="suppress-abort-error" strategy="beforeInteractive">
            {`
              window.addEventListener('unhandledrejection', function(event) {
                if (event.reason && (event.reason.name === 'AbortError' || (event.reason.message && event.reason.message.includes('signal is aborted without reason')))) {
                  event.preventDefault();
                }
              });
            `}
          </Script>
          <Script

          id="orchids-browser-logs"
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts/orchids-browser-logs.js"
          strategy="afterInteractive"
          data-orchids-project-id="2980506c-a103-4014-bdd1-8040daa616d8"
        />
      </body>
    </html>
  );
}
