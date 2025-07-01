// app/head.tsx

export default function Head() {
    return (
        <>
            <title>T.M.I</title>
            <meta name="description" content="T.M.I : Travel Memory Index | 여행의 순간들을 기록하고 추억하는 YHR의 아카이브입니다." />
            {/* PNG 우선 */}
            <link rel="icon" href="/favicon.png" type="image/png" />
            {/* Fallback: ICO */}
            <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        </>
    );
}
