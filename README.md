# Weight & Amount Calculator (Firebase version)

Static website: HTML + CSS + JavaScript, with Firebase Authentication and Firestore
so accounts and bills work on every phone / computer.

## One-time Firebase setup
1. Firebase console -> Build -> Authentication -> Sign-in method -> Email/Password -> Enable.
2. Firebase console -> Build -> Firestore Database -> Rules tab -> paste the content of
   `firestore.rules` -> Publish.
3. Authentication -> Settings -> Authorized domains -> Add domain:
   `<your-username>.github.io`

## Put it live (GitHub Pages)
Upload every file in this folder (no sub-folders) to the repository root.
Settings -> Pages -> Deploy from a branch -> main -> / (root).

Live link: https://<your-username>.github.io/<repo-name>/
