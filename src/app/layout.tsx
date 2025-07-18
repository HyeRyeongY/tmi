import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/reset.scss";
import "@/styles/global.scss";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "T.M.I",
  description:
    "T.M.I : Travel Memory Index | 여행의 순간들을 기록하고 추억하는 YHR의 아카이브입니다.",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/ico" />
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="menu">
          <ul>
            <li>
              <Link href="/">
                T<span>Timeline</span>
              </Link>
            </li>
            <li>
              <Link href="/mapLog">
                M<span>Map</span>
              </Link>
            </li>
            <li>
              <Link href="/indexLog">
                I<span>Index</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="info">
          <button>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.19531 8.76498C8.42304 8.06326 8.84053 7.43829 9.40137 6.95899C9.96221 6.47968 10.6444 6.16501 11.373 6.0494C12.1017 5.9338 12.8486 6.02202 13.5303 6.3042C14.2119 6.58637 14.8016 7.05166 15.2354 7.64844C15.6691 8.24521 15.9295 8.95008 15.9875 9.68554C16.0455 10.421 15.8985 11.1581 15.5636 11.8154C15.2287 12.4728 14.7192 13.0251 14.0901 13.4106C13.4611 13.7961 12.7377 14.0002 12 14.0002V14.9998M12.0498 19V19.1L11.9502 19.1002V19H12.0498Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="info-text">
            <strong>T.M.I</strong> <span>Travel Memory Index</span>
            <br />
            <p>My personal archiving project for recording and preserving travel memories.</p>
          </div>
        </div>

        {children}
      </body>
    </html>
  );
}
