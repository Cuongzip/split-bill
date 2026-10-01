import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BillSplit — Chia tiền hoá đơn thông minh",
  description: "Chia tiền hoá đơn nhóm minh bạch, tính toán chuẩn xác theo từng món ăn",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var clean = function() {
                  document.querySelectorAll('[bis_skin_checked],[bis_register]').forEach(function(el) {
                    el.removeAttribute('bis_skin_checked');
                    el.removeAttribute('bis_register');
                  });
                };
                if (typeof MutationObserver !== 'undefined') {
                  new MutationObserver(function(mutations) {
                    mutations.forEach(function(m) {
                      if (m.type === 'attributes') {
                        if (m.target && m.target.removeAttribute) {
                          if (m.attributeName === 'bis_skin_checked') m.target.removeAttribute('bis_skin_checked');
                          if (m.attributeName === 'bis_register') m.target.removeAttribute('bis_register');
                        }
                      }
                    });
                  }).observe(document.documentElement, { attributes: true, subtree: true, attributeFilter: ['bis_skin_checked', 'bis_register'] });
                }
                clean();
                document.addEventListener('DOMContentLoaded', clean);
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col font-sans">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
