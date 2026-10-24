# Weight & Amount Calculator

Static website (HTML + CSS + JavaScript) with Firebase Authentication + Firestore.
Features: login/register (company details), up to 1000 item weights, Per Amount,
Items & Balance Weight, Total Amount, PDF bill, saved bill history, change/forgot password,
Tamil / English, dark mode. Works on every phone and computer.

## One-time Firebase setup
1. Authentication -> Sign-in method -> Email/Password -> Enable.
2. Firestore Database -> Rules tab -> replace everything with the content of `firestore.rules` -> Publish.
   (The rules changed in this version: they add the `usernames` part. Publish them again.)
3. Authentication -> Settings -> Authorized domains -> add `<your-username>.github.io`.
4. (Optional) Authentication -> Templates -> Password reset -> change the language to Tamil.

## Put it live (GitHub Pages)
Upload every file in this folder (no sub-folders) to the repository root.
Settings -> Pages -> Deploy from a branch -> main -> / (root).
Live link: https://<your-username>.github.io/<repo-name>/
