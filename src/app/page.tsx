"use client";

import Link from "next/link";

export default function Home() {
    return (
        <div>
            <Link href="/timeCapsule">
                <button>Time Capsule</button>
            </Link>
            <Link href="/mapLog">
                <button>Map Log</button>
            </Link>
            <Link href="/gallery">
                <button>Gallery</button>
            </Link>
        </div>
    );
}
