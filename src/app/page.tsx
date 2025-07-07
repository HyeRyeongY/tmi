"use client";

// import Link from "next/link";
import Image from "next/image";

export default function GalleryPage() {
  const images = Array.from({ length: 34 }, (_, i) => {
    const num = String(i + 1).padStart(2, "0");
    return `/img/20241017_20241019/${num}.jpg`;
  });

  return (
    <div>
      {images.map((src, i) => (
        <Image
          key={i}
          src={src}
          alt={`Image ${i + 1}`}
          width={800} // 원하는 width
          height={600} // 원하는 height
        />
      ))}

      {/* <Link href="/timeCapsule">
                <button>Time Capsule</button>
            </Link>
            <Link href="/mapLog">
                <button>Map Log</button>
            </Link>
            <Link href="/gallery">
                <button>Gallery</button>
            </Link> */}
    </div>
  );
}
