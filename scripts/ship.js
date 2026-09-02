/**
 * One-command workflow to validate, commit, and push updates to GitHub & Vercel.
 * Usage:
 *   npm run ship
 *   npm run ship "feat: description of update"
 */

const { execSync } = require("child_process");

const messageArg = process.argv.slice(2).join(" ").trim();
const commitMessage = messageArg || `chore: update ${new Date().toISOString().replace(/T/, " ").replace(/\..+/, "")}`;

console.log("=========================================================");
console.log("🚀 ACHO COFFEE — AUTO SHIP & DEPLOY TO GITHUB");
console.log("=========================================================");
console.log(`Commit message: "${commitMessage}"`);

try {
  console.log("\n1. Running TypeScript & ESLint validation...");
  execSync("npm run validate", { stdio: "inherit" });

  console.log("\n2. Staging changes...");
  execSync("git add .", { stdio: "inherit" });

  const status = execSync("git status --porcelain", { encoding: "utf8" });
  if (!status.trim()) {
    console.log("✓ No changes to commit. Repository is already up to date!");
    process.exit(0);
  }

  console.log("\n3. Committing changes...");
  execSync(`git commit -m "${commitMessage}"`, { stdio: "inherit" });

  console.log("\n4. Pushing to GitHub (origin/main)...");
  execSync("git push origin main", { stdio: "inherit" });

  console.log("\n=========================================================");
  console.log("🎉 SUCCESSFULLY DEPLOYED TO GITHUB & TRIGGERED CI/CD!");
  console.log("=========================================================");
} catch (err) {
  console.error("\n❌ Ship failed:", err.message);
  process.exit(1);
}
