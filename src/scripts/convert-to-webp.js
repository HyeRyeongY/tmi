// scripts/convert-to-webp.js
import { exec } from "child_process";
import path from "path";
import fs from "fs";

const targetDir = path.resolve("public/images");

function walk(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walk(filepath, filelist);
    } else if (/\.(jpe?g|png)$/i.test(file)) {
      filelist.push(filepath);
    }
  });
  return filelist;
}

const files = walk(targetDir);
if (files.length === 0) {
  console.log("❌ 변환할 이미지가 없습니다.");
  process.exit(0);
}

console.log(`🔄 ${files.length}개 이미지 변환 중...`);

files.forEach((file) => {
  const cmd = `npx squoosh-cli --webp '{}' --output-dir ${path.dirname(file)} ${file}`;
  exec(cmd, (err) => {
    if (err) {
      console.error("❌ 변환 실패:", file);
    } else {
      console.log("✅ 변환 완료:", path.basename(file));
    }
  });
});
